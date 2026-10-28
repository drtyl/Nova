package com.drtyl.nova

import android.Manifest
import android.app.AlarmManager
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.SearchManager
import android.content.BroadcastReceiver
import android.content.ContentUris
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraManager
import android.media.AudioManager
import android.net.Uri
import android.os.Build
import android.provider.AlarmClock
import android.provider.CalendarContract
import android.provider.ContactsContract
import android.provider.MediaStore
import android.provider.Settings
import android.view.KeyEvent
import org.json.JSONArray
import org.json.JSONObject
import java.text.Normalizer
import java.util.Calendar
import java.util.Locale

/**
 * TELEFON — Nova'nın telefonda yapabildikleri. Yapay zekâ {"telefon":{"is":"…", …}} komutu verir, burası yapar.
 * Geri alınamayan işler (arama, mesaj gönderme) kullanıcının son dokunuşuyla olur: Nova numarayı çevirir /
 * mesajı yazar, "Ara" / "Gönder" düğmesine kullanıcı basar.
 *
 * Sonuç: {"ok":true|false, "mesaj":"…", "veri":…, "izin":"…" (izin gerekiyorsa)}
 */
object Telefon {
    private val tr = Locale("tr", "TR")
    private var fenerAcik = false

    private fun sonuc(ok: Boolean, mesaj: String, veri: Any? = null) = JSONObject().put("ok", ok).put("mesaj", mesaj).apply { if (veri != null) put("veri", veri) }
    private fun izinGerek(izin: String, mesaj: String) = sonuc(false, mesaj).put("izin", izin)
    private fun baslat(ctx: Context, i: Intent): Boolean = try { ctx.startActivity(i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)); true } catch (_: Throwable) { false }
    fun sade(s: String): String = Normalizer.normalize(s.lowercase(tr), Normalizer.Form.NFD).replace(Regex("\\p{M}+"), "")
        .replace('ı', 'i').replace(Regex("[^a-z0-9 ]"), " ").replace(Regex("\\s+"), " ").trim()

    fun calistir(ctx: Context, k: JSONObject): JSONObject = try {
        when (k.optString("is")) {
            "alarm" -> {
                val saat = k.optInt("saat", -1); val dk = k.optInt("dakika", 0)
                if (saat !in 0..23) sonuc(false, "Alarm saati anlaşılamadı.")
                else {
                    val i = Intent(AlarmClock.ACTION_SET_ALARM).putExtra(AlarmClock.EXTRA_HOUR, saat).putExtra(AlarmClock.EXTRA_MINUTES, dk)
                        .putExtra(AlarmClock.EXTRA_SKIP_UI, true).putExtra(AlarmClock.EXTRA_MESSAGE, k.optString("etiket", "Nova"))
                    if (baslat(ctx, i)) sonuc(true, String.format(tr, "Alarm %02d:%02d için kuruldu.", saat, dk)) else sonuc(false, "Saat uygulaması alarmı kabul etmedi.")
                }
            }
            "zamanlayici" -> {
                val sn = k.optInt("saniye", 0)
                if (sn <= 0) sonuc(false, "Süre anlaşılamadı.")
                else if (baslat(ctx, Intent(AlarmClock.ACTION_SET_TIMER).putExtra(AlarmClock.EXTRA_LENGTH, sn).putExtra(AlarmClock.EXTRA_SKIP_UI, true).putExtra(AlarmClock.EXTRA_MESSAGE, k.optString("etiket", "Nova"))))
                    sonuc(true, "Zamanlayıcı ${sureYaz(sn)} için başladı.") else sonuc(false, "Saat uygulaması zamanlayıcıyı kabul etmedi.")
            }
            "alarmlar" -> { baslat(ctx, Intent(AlarmClock.ACTION_SHOW_ALARMS)); sonuc(true, "Alarmlar açıldı.") }
            "hatirlat" -> {
                val zaman = k.optLong("zaman", 0); val metin = k.optString("metin", "").trim()
                if (zaman < System.currentTimeMillis() + 5000 || metin.isEmpty()) sonuc(false, "Hatırlatma zamanı ya da konusu anlaşılamadı.")
                else { val id = Hatirlatici.ekle(ctx, zaman, metin); sonuc(true, "Hatırlatacağım.", JSONObject().put("id", id)) }
            }
            "hatirlatmalar" -> sonuc(true, "", Hatirlatici.liste(ctx))
            "hatirlatma_sil" -> { Hatirlatici.sil(ctx, k.optString("id")); sonuc(true, "Hatırlatma silindi.") }
            "ara" -> {
                val no = numara(ctx, k)
                if (no == null) { if (izinVar(ctx, Manifest.permission.READ_CONTACTS)) sonuc(false, "\"${k.optString("kisi")}\" rehberde bulunamadı.") else izinGerek(Manifest.permission.READ_CONTACTS, "Rehbere bakmam için izin gerekiyor.") }
                else if (baslat(ctx, Intent(Intent.ACTION_DIAL, Uri.parse("tel:" + Uri.encode(no.first))))) sonuc(true, "${no.second} numarasını çevirdim, aramak için yeşil düğmeye bas.") else sonuc(false, "Telefon uygulaması açılamadı.")
            }
            "mesaj" -> {
                val metin = k.optString("metin", ""); val uyg = k.optString("uygulama", "sms")
                val no = if (k.has("kisi") || k.has("numara")) numara(ctx, k) else null
                if ((k.has("kisi") && no == null) && !izinVar(ctx, Manifest.permission.READ_CONTACTS)) izinGerek(Manifest.permission.READ_CONTACTS, "Rehbere bakmam için izin gerekiyor.")
                else if (uyg == "whatsapp") {
                    val i = if (no != null) Intent(Intent.ACTION_VIEW, Uri.parse("https://api.whatsapp.com/send?phone=" + uluslararasi(no.first) + "&text=" + Uri.encode(metin)))
                            else Intent(Intent.ACTION_SEND).setType("text/plain").putExtra(Intent.EXTRA_TEXT, metin).setPackage("com.whatsapp")
                    if (baslat(ctx, i)) sonuc(true, "Mesajı WhatsApp'ta yazdım; göndermek için gönder'e bas.") else sonuc(false, "WhatsApp açılamadı.")
                } else {
                    val i = Intent(Intent.ACTION_SENDTO, Uri.parse("smsto:" + (no?.first ?: ""))).putExtra("sms_body", metin)
                    if (baslat(ctx, i)) sonuc(true, "Mesajı yazdım; göndermek için gönder'e bas.") else sonuc(false, "Mesaj uygulaması açılamadı.")
                }
            }
            "uygulama" -> {
                val ad = k.optString("ad"); val bul = uygulamaBul(ctx, ad)
                if (bul == null) sonuc(false, "\"$ad\" diye bir uygulama bulamadım.")
                else if (baslat(ctx, bul.second)) sonuc(true, "${bul.first} açıldı.") else sonuc(false, "${bul.first} açılamadı.")
            }
            "fener" -> {
                val cm = ctx.getSystemService(CameraManager::class.java)
                val id = cm.cameraIdList.firstOrNull { cm.getCameraCharacteristics(it).get(CameraCharacteristics.FLASH_INFO_AVAILABLE) == true }
                if (id == null) sonuc(false, "Bu telefonda fener yok.")
                else { val ac = if (k.has("acik")) k.optBoolean("acik") else !fenerAcik; cm.setTorchMode(id, ac); fenerAcik = ac; sonuc(true, if (ac) "Fener açık." else "Fener kapalı.") }
            }
            "yol" -> {
                val hedef = k.optString("hedef"); val mod = when (k.optString("mod")) { "yuruyus" -> "w"; "bisiklet" -> "b"; "toplu" -> "r"; else -> "d" }
                val i = Intent(Intent.ACTION_VIEW, Uri.parse("google.navigation:q=" + Uri.encode(hedef) + "&mode=" + mod))
                if (baslat(ctx, i) || baslat(ctx, Intent(Intent.ACTION_VIEW, Uri.parse("geo:0,0?q=" + Uri.encode(hedef))))) sonuc(true, "$hedef için yol tarifi açıldı.") else sonuc(false, "Harita uygulaması açılamadı.")
            }
            "harita" -> { if (baslat(ctx, Intent(Intent.ACTION_VIEW, Uri.parse("geo:0,0?q=" + Uri.encode(k.optString("sorgu")))))) sonuc(true, "Haritada açtım.") else sonuc(false, "Harita uygulaması açılamadı.") }
            "muzik" -> {
                val am = ctx.getSystemService(AudioManager::class.java)
                val tus = when (k.optString("eylem")) { "oynat" -> KeyEvent.KEYCODE_MEDIA_PLAY; "durdur" -> KeyEvent.KEYCODE_MEDIA_PAUSE; "sonraki" -> KeyEvent.KEYCODE_MEDIA_NEXT; "onceki" -> KeyEvent.KEYCODE_MEDIA_PREVIOUS; else -> KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE }
                am.dispatchMediaKeyEvent(KeyEvent(KeyEvent.ACTION_DOWN, tus)); am.dispatchMediaKeyEvent(KeyEvent(KeyEvent.ACTION_UP, tus))
                sonuc(true, "Tamam.")
            }
            "ses" -> {
                val am = ctx.getSystemService(AudioManager::class.java); val akis = AudioManager.STREAM_MUSIC
                when (k.optString("yon")) {
                    "arttir" -> am.adjustStreamVolume(akis, AudioManager.ADJUST_RAISE, AudioManager.FLAG_SHOW_UI)
                    "azalt" -> am.adjustStreamVolume(akis, AudioManager.ADJUST_LOWER, AudioManager.FLAG_SHOW_UI)
                    "sessiz" -> am.adjustStreamVolume(akis, AudioManager.ADJUST_MUTE, AudioManager.FLAG_SHOW_UI)
                    else -> { val s = k.optInt("seviye", -1); if (s in 0..100) am.setStreamVolume(akis, am.getStreamMaxVolume(akis)*s/100, AudioManager.FLAG_SHOW_UI) }
                }
                sonuc(true, "Ses ayarlandı.")
            }
            "takvim_ekle" -> {
                val bas = k.optLong("bas", 0); val bit = k.optLong("bit", if (bas > 0) bas + 3600_000 else 0)
                val i = Intent(Intent.ACTION_INSERT).setData(CalendarContract.Events.CONTENT_URI).putExtra(CalendarContract.Events.TITLE, k.optString("baslik"))
                    .putExtra(CalendarContract.Events.EVENT_LOCATION, k.optString("yer")).putExtra(CalendarContract.Events.DESCRIPTION, k.optString("aciklama"))
                if (bas > 0) i.putExtra(CalendarContract.EXTRA_EVENT_BEGIN_TIME, bas).putExtra(CalendarContract.EXTRA_EVENT_END_TIME, bit)
                if (baslat(ctx, i)) sonuc(true, "Takvimde hazırladım; kaydetmek için Kaydet'e bas.") else sonuc(false, "Takvim uygulaması açılamadı.")
            }
            "takvim" -> {
                if (!izinVar(ctx, Manifest.permission.READ_CALENDAR)) izinGerek(Manifest.permission.READ_CALENDAR, "Takvimine bakmam için izin gerekiyor.")
                else sonuc(true, "", takvimOku(ctx, k.optInt("gun", 0), k.optInt("gunSayisi", 1)))
            }
            "ayar" -> {
                val e = when (k.optString("tur")) {
                    "wifi" -> if (Build.VERSION.SDK_INT >= 29) Settings.Panel.ACTION_WIFI else Settings.ACTION_WIFI_SETTINGS
                    "internet" -> if (Build.VERSION.SDK_INT >= 29) Settings.Panel.ACTION_INTERNET_CONNECTIVITY else Settings.ACTION_WIRELESS_SETTINGS
                    "bluetooth" -> Settings.ACTION_BLUETOOTH_SETTINGS
                    "ses" -> if (Build.VERSION.SDK_INT >= 29) Settings.Panel.ACTION_VOLUME else Settings.ACTION_SOUND_SETTINGS
                    "ekran" -> Settings.ACTION_DISPLAY_SETTINGS
                    "pil" -> Intent.ACTION_POWER_USAGE_SUMMARY
                    "konum" -> Settings.ACTION_LOCATION_SOURCE_SETTINGS
                    "rahatsiz_etme" -> Settings.ACTION_ZEN_MODE_PRIORITY_SETTINGS
                    else -> Settings.ACTION_SETTINGS
                }
                if (baslat(ctx, Intent(e))) sonuc(true, "Ayarı açtım.") else { baslat(ctx, Intent(Settings.ACTION_SETTINGS)); sonuc(true, "Ayarları açtım.") }
            }
            "web" -> { if (baslat(ctx, Intent(Intent.ACTION_WEB_SEARCH).putExtra(SearchManager.QUERY, k.optString("sorgu"))) || baslat(ctx, Intent(Intent.ACTION_VIEW, Uri.parse("https://www.google.com/search?q=" + Uri.encode(k.optString("sorgu")))))) sonuc(true, "Aradım.") else sonuc(false, "Tarayıcı açılamadı.") }
            "kamera" -> { if (baslat(ctx, Intent(MediaStore.INTENT_ACTION_STILL_IMAGE_CAMERA))) sonuc(true, "Kamera açıldı.") else sonuc(false, "Kamera açılamadı.") }
            "paylas" -> { baslat(ctx, Intent.createChooser(Intent(Intent.ACTION_SEND).setType("text/plain").putExtra(Intent.EXTRA_TEXT, k.optString("metin")), "Paylaş")); sonuc(true, "Paylaşım açıldı.") }
            "kisi" -> {
                if (!izinVar(ctx, Manifest.permission.READ_CONTACTS)) izinGerek(Manifest.permission.READ_CONTACTS, "Rehbere bakmam için izin gerekiyor.")
                else { val no = numara(ctx, k); if (no == null) sonuc(false, "Rehberde bulunamadı.") else sonuc(true, "${no.second}: ${no.first}", JSONObject().put("ad", no.second).put("numara", no.first)) }
            }
            "uygulamalar" -> sonuc(true, "", JSONArray(uygulamalar(ctx).map { it.first }.distinct().sorted().take(150)))
            else -> sonuc(false, "Bunu henüz yapamıyorum: ${k.optString("is")}")
        }
    } catch (e: SecurityException) { sonuc(false, "Bunun için izin gerekiyor: ${e.message}") } catch (e: Throwable) { sonuc(false, "Olmadı: ${e.message}") }

    private fun izinVar(ctx: Context, izin: String) = ctx.checkSelfPermission(izin) == PackageManager.PERMISSION_GRANTED
    private fun sureYaz(sn: Int): String = buildString { val s = sn/3600; val d = (sn % 3600)/60; val n = sn % 60
        if (s > 0) append("$s saat "); if (d > 0) append("$d dakika "); if (n > 0 && s == 0) append("$n saniye") }.trim()
    private fun uluslararasi(no: String): String { var n = no.filter { it.isDigit() || it == '+' }.removePrefix("+"); if (n.startsWith("0")) n = "90" + n.drop(1); if (n.length == 10 && n.startsWith("5")) n = "90$n"; return n }

    /** numara ya da kişi adı → (numara, görünen ad) */
    private fun numara(ctx: Context, k: JSONObject): Pair<String, String>? {
        val no = k.optString("numara").filter { it.isDigit() || it == '+' }
        if (no.length >= 3) return no to no
        val ad = k.optString("kisi").trim(); if (ad.isEmpty() || !izinVar(ctx, Manifest.permission.READ_CONTACTS)) return null
        val aranan = sade(ad)
        var en: Pair<String, String>? = null; var enPuan = 0
        ctx.contentResolver.query(ContactsContract.CommonDataKinds.Phone.CONTENT_URI,
            arrayOf(ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME, ContactsContract.CommonDataKinds.Phone.NUMBER, ContactsContract.CommonDataKinds.Phone.TIMES_CONTACTED), null, null, null)?.use { c ->
            while (c.moveToNext()) {
                val g = c.getString(0) ?: continue; val n = c.getString(1) ?: continue; val s = sade(g)
                val puan = when { s == aranan -> 100; s.split(' ').contains(aranan) -> 80; s.startsWith(aranan) -> 70; s.contains(aranan) -> 50; else -> 0 } + minOf(9, c.getInt(2))
                if (puan > enPuan){ enPuan = puan; en = n to g }
            }
        }
        return if (enPuan >= 50) en else null
    }

    private fun uygulamalar(ctx: Context): List<Pair<String, Intent>> {
        val pm = ctx.packageManager
        val l = pm.queryIntentActivities(Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER), 0)
        return l.map { r -> r.loadLabel(pm).toString() to Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER).setClassName(r.activityInfo.packageName, r.activityInfo.name) }
    }
    private fun uygulamaBul(ctx: Context, ad: String): Pair<String, Intent>? {
        val a = sade(ad).replace(" ", ""); if (a.isEmpty()) return null
        var en: Pair<String, Intent>? = null; var enPuan = 0
        for ((etiket, i) in uygulamalar(ctx)) {
            val e = sade(etiket).replace(" ", "")
            val puan = when { e == a -> 100; e.startsWith(a) -> 80; e.contains(a) -> 60; a.contains(e) && e.length >= 4 -> 50; else -> 0 }
            if (puan > enPuan){ enPuan = puan; en = etiket to i }
        }
        return en
    }

    private fun takvimOku(ctx: Context, gun: Int, gunSayisi: Int): JSONArray {
        val c0 = Calendar.getInstance().apply { add(Calendar.DAY_OF_YEAR, gun); set(Calendar.HOUR_OF_DAY, 0); set(Calendar.MINUTE, 0); set(Calendar.SECOND, 0); set(Calendar.MILLISECOND, 0) }
        val bas = c0.timeInMillis; val bit = bas + 86_400_000L*maxOf(1, minOf(14, gunSayisi))
        val uri = CalendarContract.Instances.CONTENT_URI.buildUpon().also { ContentUris.appendId(it, bas); ContentUris.appendId(it, bit) }.build()
        val arr = JSONArray()
        ctx.contentResolver.query(uri, arrayOf(CalendarContract.Instances.TITLE, CalendarContract.Instances.BEGIN, CalendarContract.Instances.END, CalendarContract.Instances.ALL_DAY, CalendarContract.Instances.EVENT_LOCATION),
            null, null, CalendarContract.Instances.BEGIN + " ASC")?.use { c ->
            while (c.moveToNext() && arr.length() < 30) arr.put(JSONObject().put("baslik", c.getString(0) ?: "").put("bas", c.getLong(1)).put("bit", c.getLong(2)).put("tumGun", c.getInt(3) == 1).put("yer", c.getString(4) ?: ""))
        }
        return arr
    }
}

/** Hatırlatmalar: Nova'nın kendi bildirimiyle, zamanı gelince (telefon yeniden başlasa da) */
object Hatirlatici {
    private const val TERCIH = "nova_hatirlat"
    private fun oku(ctx: Context): JSONArray = try { JSONArray(ctx.getSharedPreferences(TERCIH, 0).getString("l", "[]")) } catch (_: Throwable) { JSONArray() }
    private fun yaz(ctx: Context, a: JSONArray) = ctx.getSharedPreferences(TERCIH, 0).edit().putString("l", a.toString()).apply()
    fun liste(ctx: Context): JSONArray { val a = oku(ctx); val simdi = System.currentTimeMillis(); val o = JSONArray(); for (i in 0 until a.length()) { val h = a.getJSONObject(i); if (h.getLong("zaman") > simdi - 60_000) o.put(h) }; return o }
    fun ekle(ctx: Context, zaman: Long, metin: String): String {
        val id = "h" + System.currentTimeMillis().toString(36)
        val a = liste(ctx); a.put(JSONObject().put("id", id).put("zaman", zaman).put("metin", metin)); yaz(ctx, a)
        kur(ctx, id, zaman, metin); return id
    }
    fun sil(ctx: Context, id: String) {
        val a = oku(ctx); val o = JSONArray(); for (i in 0 until a.length()) { val h = a.getJSONObject(i); if (h.getString("id") != id) o.put(h) }; yaz(ctx, o)
        ctx.getSystemService(AlarmManager::class.java)?.cancel(pi(ctx, id, ""))
    }
    fun hepsiniKur(ctx: Context) { val a = liste(ctx); for (i in 0 until a.length()) { val h = a.getJSONObject(i); kur(ctx, h.getString("id"), h.getLong("zaman"), h.getString("metin")) } }
    private fun pi(ctx: Context, id: String, metin: String) = PendingIntent.getBroadcast(ctx, id.hashCode(),
        Intent(ctx, HatirlaticiAlici::class.java).putExtra("id", id).putExtra("metin", metin), PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
    private fun kur(ctx: Context, id: String, zaman: Long, metin: String) {
        val am = ctx.getSystemService(AlarmManager::class.java) ?: return
        val p = pi(ctx, id, metin)
        try {
            if (Build.VERSION.SDK_INT < 31 || am.canScheduleExactAlarms()) am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, zaman, p)
            else am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, zaman, p)
        } catch (_: SecurityException) { am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, zaman, p) }
    }
}

class HatirlaticiAlici : BroadcastReceiver() {
    override fun onReceive(c: Context, i: Intent) {
        val metin = i.getStringExtra("metin") ?: return
        try {
            val nm = c.getSystemService(NotificationManager::class.java) ?: return
            if (Build.VERSION.SDK_INT >= 26) nm.createNotificationChannel(NotificationChannel("nova_hatirlat", "Nova'nın hatırlatmaları", NotificationManager.IMPORTANCE_HIGH))
            val ac = PendingIntent.getActivity(c, 8, Intent(c, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK).putExtra("hatirlatma", metin), PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
            val b = (if (Build.VERSION.SDK_INT >= 26) Notification.Builder(c, "nova_hatirlat") else @Suppress("DEPRECATION") Notification.Builder(c))
                .setSmallIcon(c.applicationInfo.icon).setContentTitle("Nova: hatırlatma").setContentText(metin).setStyle(Notification.BigTextStyle().bigText(metin))
                .setContentIntent(ac).setAutoCancel(true).setCategory(Notification.CATEGORY_REMINDER)
            nm.notify((i.getStringExtra("id") ?: metin).hashCode(), b.build())
            DisariServisi.hatirlat(c, metin)
            Gunluk.yerel("hatirlat", metin)
        } catch (_: Throwable) {}
    }
}
