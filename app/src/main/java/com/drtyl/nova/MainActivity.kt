package com.drtyl.nova

import android.Manifest
import android.app.Activity
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.webkit.JavascriptInterface
import android.webkit.WebView
import org.json.JSONObject

/**
 * Nova — tek karakter, tek oda. Uygulama Nova'nın EVİ.
 *
 * Native taraf bilerek küçük:
 *  1) Web dosyalarını (assets/www) https://nova.yerel/ adresinden sunar (Varlik.kt)
 *  2) window.NovaNative köprüsü: depo, internet, mikrofon, ses (NovaKopru.kt), bildirim, izinler
 *  3) Nova'yı dışarı çıkarır (DisariServisi) ve uygulama açılınca eve geri alır
 */
class MainActivity : Activity() {

    private lateinit var web: WebView
    private val main = Handler(Looper.getMainLooper())
    private lateinit var ses: NovaSes
    private var dinlemeBekliyor = false
    private var yuklendi = false

    companion object {
        private const val MIC_IZNI = 4343
        private const val BILDIRIM_IZNI = 4444
        private const val GENEL_IZIN = 4545
        private const val KANAL = "nova"
        @Volatile var onde = false
    }
    private var uyanBekliyor = false
    private var hatirlatmaBekliyor: String? = null

    /** "Nova ses ver" ya da hatırlatma bildirimiyle açıldıysa */
    private fun niyetIsle(i: Intent?) {
        if (i == null) return
        if (i.getBooleanExtra("uyan", false)) {
            i.removeExtra("uyan")
            uyanBekliyor = true
            if (Build.VERSION.SDK_INT >= 27) { setShowWhenLocked(true); setTurnScreenOn(true) }
            js("if (window.novaUyandi) { NovaNative.uyanmaVarMi(); novaUyandi(); }")   // sayfa henüz yüklenmediyse açılışta sorar
        }
        i.getStringExtra("hatirlatma")?.let { m -> i.removeExtra("hatirlatma"); hatirlatmaBekliyor = m; js("if (window.novaHatirlat) { NovaNative.hatirlatmaAl(); novaHatirlat(${JSONObject.quote(m)}); }") }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        niyetIsle(intent)
    }

    private fun js(kod: String) { if (::web.isInitialized) web.evaluateJavascript(kod, null) }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        WebView.setWebContentsDebuggingEnabled(true)
        web = WebView(this)
        setContentView(web)
        Varlik.kur(this, web, "ev", true)
        ses = NovaSes(this) { o, v -> main.post { js("window.__novaSes && window.__novaSes('$o',${JSONObject.quote(v)})") } }
        web.addJavascriptInterface(Kopru(), "NovaNative")
        // Nova dışarıdaysa eve dönsün: uygulama onun evi
        if (DisariServisi.calisiyor) DisariServisi.hemenDur(this)
        web.loadUrl("https://${Varlik.ALAN}/index.html")
        yuklendi = true
        bildirimKanaliniKur()
        niyetIsle(intent)
    }

    // ---------------------------------------------------------------- BİLDİRİM
    private fun bildirimKanaliniKur() {
        try {
            if (Build.VERSION.SDK_INT >= 26) {
                getSystemService(NotificationManager::class.java)?.createNotificationChannel(
                    NotificationChannel(KANAL, "Nova", NotificationManager.IMPORTANCE_DEFAULT).apply { description = "Nova'nın mesajları ve hatırlatmaları" })
            }
        } catch (_: Throwable) {}
    }

    private fun bildirimIzniVarMi(): Boolean =
        Build.VERSION.SDK_INT < 33 || checkSelfPermission("android.permission.POST_NOTIFICATIONS") == PackageManager.PERMISSION_GRANTED

    private fun bildirimGoster(baslik: String, metin: String, anahtar: String) {
        try {
            if (!bildirimIzniVarMi()) return
            val ac = Intent(this, MainActivity::class.java).apply { flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP }
            val pi = PendingIntent.getActivity(this, 0, ac, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
            val b = (if (Build.VERSION.SDK_INT >= 26) Notification.Builder(this, KANAL) else @Suppress("DEPRECATION") Notification.Builder(this))
                .setSmallIcon(applicationInfo.icon).setContentTitle(baslik).setContentText(metin)
                .setStyle(Notification.BigTextStyle().bigText(metin)).setContentIntent(pi).setAutoCancel(true)
            getSystemService(NotificationManager::class.java)?.notify(anahtar.hashCode(), b.build())
        } catch (_: Throwable) {}
    }

    // ---------------------------------------------------------------- İZİNLER
    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        val izin = grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED
        if (requestCode == BILDIRIM_IZNI) { js("window.__novaBildirimIzni && window.__novaBildirimIzni($izin)"); return }
        if (requestCode == GENEL_IZIN) { js("window.__novaIzin && window.__novaIzin('${permissions.firstOrNull() ?: ""}',$izin)"); return }
        if (requestCode == MIC_IZNI) {
            if (izin && dinlemeBekliyor) ses.dinle { }
            else if (!izin) js("window.__novaSes && window.__novaSes('hata','Mikrofon izni verilmedi.')")
            dinlemeBekliyor = false
            if (izin) Kulak.baslat(this)
            js("window.__novaIzinDegisti && window.__novaIzinDegisti()")
        }
    }

    private fun ayarAc(eylem: String, paket: Boolean) {
        try {
            val i = Intent(eylem)
            if (paket) i.data = Uri.parse("package:$packageName")
            startActivity(i)
        } catch (_: Throwable) {
            try { startActivity(Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:$packageName"))) } catch (_: Throwable) {}
        }
    }

    // ---------------------------------------------------------------- YAŞAM DÖNGÜSÜ
    @Deprecated("Activity.onBackPressed")
    override fun onBackPressed() {
        web.evaluateJavascript("(window.novaGeri ? window.novaGeri() : false)") { result ->
            if (result != "true") {
                @Suppress("DEPRECATION")
                super.onBackPressed()
            }
        }
    }

    override fun onPause() {
        super.onPause()
        onde = false
        js("window.novaDuraklat && window.novaDuraklat()")
    }

    override fun onStop() {
        super.onStop()
        // kilit ekranının üstünde gösterme yalnızca "Nova ses ver" oturumu içindi
        if (Build.VERSION.SDK_INT >= 27) { setShowWhenLocked(false); setTurnScreenOn(false) }
    }

    override fun onResume() {
        super.onResume()
        onde = true
        Kulak.baslat(this)   // açıksa dinlemeye devam (Android mikrofonu ancak uygulama öndeyken başlatmaya izin verir)
        // dışarıdaysa: eve gel (dış pencere kapanır, odada kapıdan girer)
        if (DisariServisi.calisiyor) {
            DisariServisi.hemenDur(this)
            js("window.novaEveGeldi && window.novaEveGeldi()")
        }
        js("window.novaDevam && window.novaDevam(); window.__novaIzinDegisti && window.__novaIzinDegisti()")
    }

    override fun onDestroy() {
        ses.kapat()
        super.onDestroy()
    }

    // ---------------------------------------------------------------- KÖPRÜ
    inner class Kopru : NovaKopru(this@MainActivity, ses, { k -> main.post { js(k) } }) {

        @JavascriptInterface
        override fun dinle() {
            main.post {
                ses.dinle {
                    dinlemeBekliyor = true
                    requestPermissions(arrayOf(Manifest.permission.RECORD_AUDIO), MIC_IZNI)
                }
            }
        }

        @JavascriptInterface
        fun mikrofonIzniIste() { main.post { if (!ses.mikrofonIzniVar()) requestPermissions(arrayOf(Manifest.permission.RECORD_AUDIO), MIC_IZNI) } }

        @JavascriptInterface
        fun bildirim(baslik: String, metin: String, anahtar: String) { main.post { bildirimGoster(baslik, metin, anahtar) } }

        @JavascriptInterface
        fun bildirimIzniVar(): Boolean = bildirimIzniVarMi()

        @JavascriptInterface
        fun bildirimIzniIste() {
            main.post {
                if (Build.VERSION.SDK_INT >= 33 && !bildirimIzniVarMi()) requestPermissions(arrayOf("android.permission.POST_NOTIFICATIONS"), BILDIRIM_IZNI)
                else js("window.__novaBildirimIzni && window.__novaBildirimIzni(true)")
            }
        }

        /** "Diğer uygulamaların üzerinde göster" ayar sayfası */
        @JavascriptInterface
        fun ustteGosterIzniAc() { main.post { ayarAc(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, true) } }

        /** Erişilebilirlik ayarları (Nova → simgeleri görsün) */
        @JavascriptInterface
        fun erisimAyarlariAc() { main.post { ayarAc(Settings.ACTION_ACCESSIBILITY_SETTINGS, false) } }

        /** Android 13+: yan yüklenen uygulamada erişilebilirlik "kısıtlı ayar"; uygulama bilgisi sayfasından açılır */
        @JavascriptInterface
        fun uygulamaBilgisiAc() { main.post { ayarAc(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, true) } }

        /** Nova dışarı çıkar: dış pencere başlar, uygulama arka plana geçer (ana ekran görünür) */
        @JavascriptInterface
        fun disariCik(): String {
            if (!Settings.canDrawOverlays(this@MainActivity)) return "izin"
            main.post {
                if (DisariServisi.baslat(this@MainActivity)) moveTaskToBack(true)
            }
            return "tamam"
        }

        @JavascriptInterface
        fun eveCagir() { main.post { DisariServisi.hemenDur(this@MainActivity) } }

        @JavascriptInterface
        override fun izinIste(izin: String) {
            main.post {
                if (checkSelfPermission(izin) == PackageManager.PERMISSION_GRANTED) js("window.__novaIzin && window.__novaIzin('$izin',true)")
                else requestPermissions(arrayOf(izin), GENEL_IZIN)
            }
        }

        @JavascriptInterface
        fun uyanmaVarMi(): Boolean { val v = uyanBekliyor; uyanBekliyor = false; return v }

        @JavascriptInterface
        fun hatirlatmaAl(): String { val m = hatirlatmaBekliyor ?: ""; hatirlatmaBekliyor = null; return m }

        /** pil iyileştirmesinden muaf tut (Nova dinlemeyi bırakmasın) */
        @JavascriptInterface
        fun pilKisitiKaldir() {
            main.post {
                try { startActivity(Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS, Uri.parse("package:$packageName"))) }
                catch (_: Throwable) { ayarAc(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS, false) }
            }
        }

        /** Xiaomi / Redmi / POCO: otomatik başlatma ve "arka planda açılır pencere" izinleri */
        @JavascriptInterface
        fun xiaomiIzinleri(tur: String) {
            main.post {
                val niyetler = if (tur == "otobaslat") listOf(
                    Intent().setClassName("com.miui.securitycenter", "com.miui.permcenter.autostart.AutoStartManagementActivity"))
                else listOf(
                    Intent("miui.intent.action.APP_PERM_EDITOR").setClassName("com.miui.securitycenter", "com.miui.permcenter.permissions.PermissionsEditorActivity").putExtra("extra_pkgname", packageName),
                    Intent("miui.intent.action.APP_PERM_EDITOR").setClassName("com.miui.securitycenter", "com.miui.permcenter.permissions.AppPermissionsEditorActivity").putExtra("extra_pkgname", packageName))
                if (niyetler.none { try { startActivity(it); true } catch (_: Throwable) { false } }) ayarAc(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, true)
            }
        }
    }
}
