package com.drtyl.nova

import android.Manifest
import android.annotation.SuppressLint
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.os.PowerManager
import android.os.VibrationEffect
import android.os.Vibrator
import org.json.JSONObject
import org.vosk.Model
import org.vosk.Recognizer
import org.vosk.android.RecognitionListener
import org.vosk.android.SpeechService
import org.vosk.android.StorageService
import java.util.Locale

/**
 * KULAK — "Nova ses ver" deyince uyanır.
 *
 * Telefonun içinde, internetsiz çalışan Türkçe ses tanıma (Vosk, assets/model-tr) sürekli dinler; yalnızca
 * tetikleyici sözü arar. Hiçbir ses kaydedilmez, hiçbir yere gönderilmez. Söz duyulunca:
 *  · Nova dışarıdaysa (ana ekranda) orada dinlemeye başlar
 *  · değilse ekranı açar, Nova'yı getirir (kilit ekranının üstünde de) ve dinlemeye başlar
 * Nova kendisi konuşurken ya da asıl dinlemeyi (Google konuşma tanıma) yaparken kulak bekler, sonra devam eder.
 */
object Kulak {
    private const val TERCIH = "nova_kulak"
    @Volatile var servis: DinlemeServisi? = null
    private val ana = Handler(Looper.getMainLooper())
    private val mesgul = mutableSetOf<String>()
    private var devamIsi: Runnable? = null
    @Volatile var durum: String = "kapalı"
    @Volatile var sonDuyulan: String = ""

    fun acikMi(ctx: Context) = ctx.getSharedPreferences(TERCIH, 0).getBoolean("acik", false)
    fun ifade(ctx: Context) = ctx.getSharedPreferences(TERCIH, 0).getString("ifade", "nova ses ver") ?: "nova ses ver"
    fun ayarla(ctx: Context, acik: Boolean, ifade: String) {
        ctx.getSharedPreferences(TERCIH, 0).edit().putBoolean("acik", acik).putString("ifade", ifade.trim().ifEmpty { "nova ses ver" }).apply()
        if (acik) baslat(ctx) else ctx.stopService(Intent(ctx, DinlemeServisi::class.java))
    }

    /** Servisi başlat (uygulama öndeyken çağrılmalı: Android mikrofonu ancak öyle verir) */
    fun baslat(ctx: Context): Boolean {
        if (!acikMi(ctx)) return false
        if (ctx.checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) { durum = "mikrofon izni yok"; return false }
        return try {
            val i = Intent(ctx, DinlemeServisi::class.java)
            if (Build.VERSION.SDK_INT >= 26) ctx.startForegroundService(i) else ctx.startService(i)
            true
        } catch (e: Throwable) { durum = "başlatılamadı: ${e.message}"; Gunluk.yerel("kulak", durum); false }
    }

    /** Nova kendisi konuşurken / dinlerken kulak beklesin */
    fun mesgulAyarla(neden: String, var_: Boolean) {
        ana.post {
            if (var_) mesgul.add(neden) else mesgul.remove(neden)
            devamIsi?.let { ana.removeCallbacks(it) }; devamIsi = null
            if (mesgul.isNotEmpty()) servis?.duraklat(true)
            else { val r = Runnable { if (mesgul.isEmpty()) servis?.duraklat(false) }; devamIsi = r; ana.postDelayed(r, 1300) }
        }
    }
    fun gecici(neden: String, ms: Long) { mesgulAyarla(neden, true); ana.postDelayed({ mesgulAyarla(neden, false) }, ms) }

    // ---- tetikleyici söz eşleştirme (tanıyıcı "nova"yı "noa", "nava" gibi duyabilir: harf farkına tolerans)
    private fun uzaklik(a: String, b: String): Int {
        val d = IntArray(b.length + 1) { it }
        for (i in 1..a.length) {
            var once = d[0]; d[0] = i
            for (j in 1..b.length) { val gec = d[j]; d[j] = minOf(d[j] + 1, d[j - 1] + 1, once + if (a[i - 1] == b[j - 1]) 0 else 1); once = gec }
        }
        return d[b.length]
    }
    private val tr = Locale("tr", "TR")
    fun eslesir(metin: String, ifade: String): Boolean {
        val k = metin.lowercase(tr).split(Regex("\\s+")).filter { it.isNotBlank() }
        val h = ifade.lowercase(tr).split(Regex("\\s+")).filter { it.isNotBlank() }
        if (h.isEmpty() || k.size < h.size) return false
        for (bas in 0..k.size - h.size) {
            var tamam = true
            for (j in h.indices) {
                val izin = when { j == 0 && h[j].length >= 3 -> 2; h[j].length <= 3 -> 0; h[j].length <= 5 -> 1; else -> 2 }
                if (uzaklik(k[bas + j], h[j]) > izin) { tamam = false; break }
            }
            if (tamam) return true
        }
        return false
    }
}

class DinlemeServisi : Service(), RecognitionListener {
    companion object {
        private const val KANAL = "nova_kulak"
        private const val NO = 7171
        const val EYLEM_DUR = "com.drtyl.nova.KULAK_DUR"
    }
    private val ana = Handler(Looper.getMainLooper())
    private var model: Model? = null
    private var tanima: SpeechService? = null
    private var sonTetik = 0L
    private var duraklatildi = false

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        Kulak.servis = this
        onPlan()
        Kulak.durum = "model yükleniyor"
        StorageService.unpack(this, "model-tr", "model", { m ->
            model = m; dinlemeyeBasla()
        }, { e ->
            Kulak.durum = "Türkçe ses modeli yüklenemedi: ${e.message}"; Gunluk.yerel("kulak", Kulak.durum)
        })
    }

    private fun onPlan() {
        val nm = getSystemService(NotificationManager::class.java)
        if (Build.VERSION.SDK_INT >= 26) nm?.createNotificationChannel(NotificationChannel(KANAL, "Nova dinliyor", NotificationManager.IMPORTANCE_MIN).apply {
            description = "\"Nova ses ver\" sözünü bekler (telefonda, internetsiz)"; setShowBadge(false)
        })
        val dur = PendingIntent.getService(this, 3, Intent(this, DinlemeServisi::class.java).setAction(EYLEM_DUR), PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
        val ac = PendingIntent.getActivity(this, 4, Intent(this, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK), PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
        val n = (if (Build.VERSION.SDK_INT >= 26) Notification.Builder(this, KANAL) else @Suppress("DEPRECATION") Notification.Builder(this))
            .setSmallIcon(applicationInfo.icon)
            .setContentTitle("Nova seni duyuyor")
            .setContentText("\"${Kulak.ifade(this)}\" de, hemen gelsin. Ses telefondan çıkmaz.")
            .setContentIntent(ac).setOngoing(true)
            .addAction(Notification.Action.Builder(null, "Durdur", dur).build())
            .build()
        if (Build.VERSION.SDK_INT >= 30) startForeground(NO, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE) else startForeground(NO, n)
    }

    private fun dinlemeyeBasla() {
        try {
            val m = model ?: return
            val r = Recognizer(m, 16000f)
            tanima = SpeechService(r, 16000f).also { it.startListening(this) }
            Kulak.durum = "dinliyor"
            if (duraklatildi) tanima?.setPause(true)
        } catch (e: Throwable) {
            Kulak.durum = "mikrofon açılamadı: ${e.message}"; Gunluk.yerel("kulak", Kulak.durum)
            ana.postDelayed({ dinlemeyeBasla() }, 15000)
        }
    }

    fun duraklat(evet: Boolean) {
        duraklatildi = evet
        try { tanima?.setPause(evet) } catch (_: Throwable) {}
        Kulak.durum = if (evet) "bekliyor (Nova konuşuyor/dinliyor)" else "dinliyor"
    }

    // ---- tanıma sonuçları
    private fun bak(json: String, alan: String) {
        val metin = try { JSONObject(json).optString(alan, "") } catch (_: Throwable) { "" }
        if (metin.isBlank()) return
        Kulak.sonDuyulan = metin
        if (Kulak.eslesir(metin, Kulak.ifade(this))) tetikle()
    }
    override fun onPartialResult(hypothesis: String?) { hypothesis?.let { bak(it, "partial") } }
    override fun onResult(hypothesis: String?) { hypothesis?.let { bak(it, "text") } }
    override fun onFinalResult(hypothesis: String?) {}
    override fun onError(exception: Exception?) { Kulak.durum = "hata: ${exception?.message}"; Gunluk.yerel("kulak", Kulak.durum); ana.postDelayed({ yenidenBasla() }, 3000) }
    override fun onTimeout() { yenidenBasla() }

    private fun yenidenBasla() { try { tanima?.stop(); tanima?.shutdown() } catch (_: Throwable) {}; tanima = null; dinlemeyeBasla() }

    @SuppressLint("WakelockTimeout")
    private fun tetikle() {
        val simdi = System.currentTimeMillis()
        if (simdi - sonTetik < 4000) return
        sonTetik = simdi
        Gunluk.yerel("kulak", "uyandı: \"${Kulak.sonDuyulan}\"")
        try { tanima?.reset() } catch (_: Throwable) {}
        Kulak.gecici("uyanma", 9000)                     // uygulama açılıp dinlemeye geçene kadar
        try {
            val v = getSystemService(Vibrator::class.java)
            if (Build.VERSION.SDK_INT >= 26) v?.vibrate(VibrationEffect.createOneShot(40, 120)) else @Suppress("DEPRECATION") v?.vibrate(40)
        } catch (_: Throwable) {}
        // ekranı aç
        try {
            val pm = getSystemService(PowerManager::class.java)
            @Suppress("DEPRECATION")
            pm?.newWakeLock(PowerManager.SCREEN_BRIGHT_WAKE_LOCK or PowerManager.ACQUIRE_CAUSES_WAKEUP or PowerManager.ON_AFTER_RELEASE, "nova:uyan")?.acquire(6000)
        } catch (_: Throwable) {}
        if (DisariServisi.calisiyor) { DisariServisi.uyandir(this); return }
        // Nova'yı ekrana getir ("üstte gösterme" izniyle arka plandan açılabilir)
        val i = Intent(this, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_REORDER_TO_FRONT).putExtra("uyan", true)
        try { startActivity(i) } catch (e: Throwable) { Gunluk.yerel("kulak", "açılamadı: ${e.message}") }
        // yedek: bazı telefonlar (ör. Xiaomi) arka plandan açmaya izin vermezse dokunulacak bildirim
        ana.postDelayed({ if (!MainActivity.onde) yedekBildirim(i) }, 1500)
    }

    private fun yedekBildirim(i: Intent) {
        try {
            val nm = getSystemService(NotificationManager::class.java) ?: return
            if (Build.VERSION.SDK_INT >= 26) nm.createNotificationChannel(NotificationChannel("nova_uyan", "Nova uyandı", NotificationManager.IMPORTANCE_HIGH))
            val pi = PendingIntent.getActivity(this, 5, i, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
            val b = (if (Build.VERSION.SDK_INT >= 26) Notification.Builder(this, "nova_uyan") else @Suppress("DEPRECATION") Notification.Builder(this))
                .setSmallIcon(applicationInfo.icon).setContentTitle("Efendim?").setContentText("Dokun, Nova seni dinlesin")
                .setContentIntent(pi).setFullScreenIntent(pi, true).setAutoCancel(true).setCategory(Notification.CATEGORY_CALL)
            nm.notify(7272, b.build())
        } catch (_: Throwable) {}
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == EYLEM_DUR) { Kulak.ayarla(this, false, Kulak.ifade(this)); stopSelf(); return START_NOT_STICKY }
        return START_STICKY
    }

    override fun onDestroy() {
        Kulak.servis = null; Kulak.durum = "kapalı"
        ana.removeCallbacksAndMessages(null)
        try { tanima?.stop(); tanima?.shutdown() } catch (_: Throwable) {}
        try { model?.close() } catch (_: Throwable) {}
        super.onDestroy()
    }
}

/** Telefon açılınca: kulak açıksa dinlemeye devam et; kurulu hatırlatmaları yeniden kur */
class AcilisAlici : BroadcastReceiver() {
    override fun onReceive(c: Context, i: Intent) {
        if (i.action != Intent.ACTION_BOOT_COMPLETED && i.action != Intent.ACTION_MY_PACKAGE_REPLACED) return
        try { Hatirlatici.hepsiniKur(c) } catch (_: Throwable) {}
        if (Kulak.acikMi(c) && !Kulak.baslat(c)) {
            try {
                val nm = c.getSystemService(NotificationManager::class.java) ?: return
                if (Build.VERSION.SDK_INT >= 26) nm.createNotificationChannel(NotificationChannel("nova", "Nova", NotificationManager.IMPORTANCE_DEFAULT))
                val pi = PendingIntent.getActivity(c, 6, Intent(c, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK), PendingIntent.FLAG_IMMUTABLE)
                val b = (if (Build.VERSION.SDK_INT >= 26) Notification.Builder(c, "nova") else @Suppress("DEPRECATION") Notification.Builder(c))
                    .setSmallIcon(c.applicationInfo.icon).setContentTitle("Nova").setContentText("Seni duyabilmem için bir kez dokun.").setContentIntent(pi).setAutoCancel(true)
                nm.notify(7373, b.build())
            } catch (_: Throwable) {}
        }
    }
}
