package com.drtyl.nova

import android.annotation.SuppressLint
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.ServiceInfo
import android.graphics.Color
import android.graphics.PixelFormat
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.os.SystemClock
import android.os.VibrationEffect
import android.os.Vibrator
import android.provider.Settings
import android.util.TypedValue
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.webkit.JavascriptInterface
import android.webkit.WebView
import android.widget.FrameLayout
import android.widget.TextView
import org.json.JSONObject
import kotlin.math.abs
import kotlin.math.hypot
import kotlin.math.roundToInt

/**
 * DIŞARIDAKİ NOVA — kullanıcı isteyince evinden (uygulamadan) çıkıp ana ekranda yaşar.
 *
 *  · Nova penceresi: yalnızca Nova'nın bedeni kadar, şeffaf bir pencere (dokunulabilir).
 *    İçinde hafif bir WebView (disari.html) Nova'yı çizer; pencerenin yerini ve boyunu JS belirler.
 *  · Konuşma balonu: ayrı, dokunulamaz küçük pencere (altındaki simgelere dokunmayı engellemez).
 *  · Dokunma: tek dokunuş → tepki, çift dokunuş → dinler (konuşursun), basılı tut / sürükle → taşırsın.
 *  · Uygulamayı açmaz. Uygulama açılınca Nova eve döner (MainActivity servisi durdurur).
 *  · Pil: ekran kapalıyken ya da başka bir uygulama açıkken çizim tamamen durur.
 */
class DisariServisi : Service() {

    companion object {
        @Volatile var calisiyor = false
        const val EYLEM_EVE = "com.drtyl.nova.EVE"          // yürüyerek eve dön
        const val EYLEM_HEMEN = "com.drtyl.nova.HEMEN"      // hemen dur (uygulama açıldı)
        private const val KANAL = "nova_disari"
        private const val BILDIRIM_NO = 7070

        fun baslat(ctx: Context): Boolean {
            if (!Settings.canDrawOverlays(ctx)) return false
            val i = Intent(ctx, DisariServisi::class.java)
            if (Build.VERSION.SDK_INT >= 26) ctx.startForegroundService(i) else ctx.startService(i)
            return true
        }
        fun eveCagir(ctx: Context) { if (calisiyor) ctx.startService(Intent(ctx, DisariServisi::class.java).setAction(EYLEM_EVE)) }
        fun hemenDur(ctx: Context) { if (calisiyor) ctx.startService(Intent(ctx, DisariServisi::class.java).setAction(EYLEM_HEMEN)) }
    }

    private val ana = Handler(Looper.getMainLooper())
    private lateinit var wm: WindowManager
    private lateinit var kap: FrameLayout
    private lateinit var web: WebView
    private lateinit var novaP: WindowManager.LayoutParams
    private lateinit var balon: TextView
    private lateinit var balonP: WindowManager.LayoutParams
    private var balonEkli = false
    private var ses: NovaSes? = null
    private var gorunur = true
    private var ekranAcik = true
    private var heryerde = false
    private var surukleniyor = false
    private var durduruluyor = false

    private fun dp(v: Float) = TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, v, resources.displayMetrics)
    private fun js(kod: String) { if (::web.isInitialized && !durduruluyor) web.evaluateJavascript(kod, null) }
    private fun olay(ad: String, veri: JSONObject = JSONObject()) = js("window.novaDis && window.novaDis('$ad',$veri)")

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        calisiyor = true
        onPlanaGec()
        wm = getSystemService(WINDOW_SERVICE) as WindowManager
        pencereleriKur()
        ses = NovaSes(this) { o, v -> ana.post { js("window.__novaSes && window.__novaSes('$o',${JSONObject.quote(v)})") } }
        val kopru = DisKopru()
        web.addJavascriptInterface(kopru, "NovaNative")
        web.addJavascriptInterface(kopru, "NovaDisari")
        web.loadUrl("https://${Varlik.ALAN}/disari.html")

        IkonDurumu.dinleyici = {
            gorunurlukGuncelle()
            olay("simgeler", IkonDurumu.json(this))
        }
        registerReceiver(ekranAlici, IntentFilter().apply { addAction(Intent.ACTION_SCREEN_OFF); addAction(Intent.ACTION_SCREEN_ON); addAction(Intent.ACTION_USER_PRESENT) })
        ana.postDelayed(yoklama, 1500)
        Gunluk.yerel("dis", "Nova dışarı çıktı")
    }

    // -------------------------------------------------------------- ön plan bildirimi
    private fun onPlanaGec() {
        val nm = getSystemService(NotificationManager::class.java)
        if (Build.VERSION.SDK_INT >= 26) nm?.createNotificationChannel(NotificationChannel(KANAL, "Nova dışarıda", NotificationManager.IMPORTANCE_LOW).apply {
            description = "Nova ana ekranındayken görünen sessiz bildirim"; setShowBadge(false)
        })
        val eve = PendingIntent.getService(this, 1, Intent(this, DisariServisi::class.java).setAction(EYLEM_EVE), PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
        val ac = PendingIntent.getActivity(this, 2, Intent(this, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP), PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
        val b = (if (Build.VERSION.SDK_INT >= 26) Notification.Builder(this, KANAL) else @Suppress("DEPRECATION") Notification.Builder(this))
            .setSmallIcon(applicationInfo.icon)
            .setContentTitle("Nova dışarıda")
            .setContentText("Ana ekranında geziyor. Çift dokun: konuş · sürükle: taşı")
            .setContentIntent(ac)
            .setOngoing(true)
            .addAction(Notification.Action.Builder(null, "Eve çağır", eve).build())
        val n = b.build()
        if (Build.VERSION.SDK_INT >= 34) {
            val mic = checkSelfPermission(android.Manifest.permission.RECORD_AUDIO) == android.content.pm.PackageManager.PERMISSION_GRANTED
            val tur = ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE or (if (mic) ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE else 0)
            startForeground(BILDIRIM_NO, n, tur)
        } else startForeground(BILDIRIM_NO, n)
    }

    // -------------------------------------------------------------- pencereler
    @SuppressLint("ClickableViewAccessibility")
    private fun pencereleriKur() {
        val tur = if (Build.VERSION.SDK_INT >= 26) WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY else @Suppress("DEPRECATION") WindowManager.LayoutParams.TYPE_PHONE
        novaP = WindowManager.LayoutParams(1, 1, tur,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS or
                WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED,
            PixelFormat.TRANSLUCENT).apply { gravity = Gravity.TOP or Gravity.START; x = -4000; y = -4000 }
        if (Build.VERSION.SDK_INT >= 28) novaP.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES

        web = WebView(this)
        web.setBackgroundColor(Color.TRANSPARENT)
        web.setLayerType(View.LAYER_TYPE_HARDWARE, null)
        web.isVerticalScrollBarEnabled = false; web.isHorizontalScrollBarEnabled = false
        web.overScrollMode = View.OVER_SCROLL_NEVER
        Varlik.kur(this, web, "dis", false)
        kap = FrameLayout(this)
        kap.addView(web, FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT))
        web.setOnTouchListener(dokunma)
        wm.addView(kap, novaP)

        balon = TextView(this).apply {
            setTextColor(Color.rgb(42, 35, 64)); setTextSize(TypedValue.COMPLEX_UNIT_SP, 14f)
            setPadding(dp(12f).toInt(), dp(8f).toInt(), dp(12f).toInt(), dp(9f).toInt())
            maxWidth = dp(230f).toInt()
            background = GradientDrawable().apply { setColor(Color.WHITE); cornerRadius = dp(16f); setStroke(dp(1f).toInt(), Color.rgb(214, 204, 245)) }
            elevation = dp(4f)
        }
        balonP = WindowManager.LayoutParams(WindowManager.LayoutParams.WRAP_CONTENT, WindowManager.LayoutParams.WRAP_CONTENT, tur,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE or WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
            PixelFormat.TRANSLUCENT).apply {
            gravity = Gravity.TOP or Gravity.START
            alpha = 0.8f   // Android 12+: dokunulamaz pencerenin altındaki simgelere dokunulabilsin diye en fazla 0,8
        }
    }

    private var sonPencere = IntArray(4)
    private fun pencereAyarla(x: Int, y: Int, w: Int, h: Int) {
        if (surukleniyor || durduruluyor) return
        val boyDegisti = w != sonPencere[2] || h != sonPencere[3]
        if (!boyDegisti && x == sonPencere[0] && y == sonPencere[1]) return
        sonPencere = intArrayOf(x, y, w, h)
        novaP.x = x; novaP.y = y; novaP.width = w.coerceAtLeast(1); novaP.height = h.coerceAtLeast(1)
        try { wm.updateViewLayout(kap, novaP) } catch (_: Throwable) {}
    }

    private fun balonGoster(metin: String, x: Int, y: Int) {
        if (metin.isEmpty() || !gorunur) {
            if (balonEkli) { try { wm.removeView(balon) } catch (_: Throwable) {}; balonEkli = false }
            return
        }
        balon.text = metin
        balon.measure(View.MeasureSpec.makeMeasureSpec(dp(230f).toInt(), View.MeasureSpec.AT_MOST), View.MeasureSpec.UNSPECIFIED)
        val ew = resources.displayMetrics.widthPixels
        balonP.x = (x - balon.measuredWidth / 2).coerceIn(dp(6f).toInt(), (ew - balon.measuredWidth - dp(6f).toInt()).coerceAtLeast(0))
        balonP.y = (y - balon.measuredHeight - dp(6f).toInt()).coerceAtLeast(dp(28f).toInt())
        try { if (balonEkli) wm.updateViewLayout(balon, balonP) else { wm.addView(balon, balonP); balonEkli = true } } catch (_: Throwable) {}
    }

    private fun gorunurlukGuncelle() {
        val olmali = ekranAcik && (heryerde || !IkonDurumu.servisAcik(this) || IkonDurumu.anaEkranda)
        if (olmali == gorunur) return
        gorunur = olmali
        kap.visibility = if (olmali) View.VISIBLE else View.GONE
        if (!olmali) balonGoster("", 0, 0)
        if (olmali) { web.onResume(); web.resumeTimers() } else { web.onPause(); web.pauseTimers() }
        olay("gorunur", JSONObject().put("acik", olmali))
    }

    private val yoklama = object : Runnable {
        override fun run() {
            if (durduruluyor) return
            if (ekranAcik) IkonDurumu.yenile()
            ana.postDelayed(this, if (gorunur) 1500 else 2500)
        }
    }

    private val ekranAlici = object : BroadcastReceiver() {
        override fun onReceive(c: Context, i: Intent) {
            when (i.action) {
                Intent.ACTION_SCREEN_OFF -> { ekranAcik = false; gorunurlukGuncelle() }
                Intent.ACTION_SCREEN_ON, Intent.ACTION_USER_PRESENT -> { ekranAcik = true; gorunurlukGuncelle(); IkonDurumu.yenile() }
            }
        }
    }

    // -------------------------------------------------------------- dokunma
    private var basX = 0f; private var basY = 0f; private var pX = 0; private var pY = 0
    private var basZaman = 0L; private var sonDokunus = 0L; private var tekBekliyor: Runnable? = null
    private val uzunBasma = Runnable { surukleBasla() }

    private fun surukleBasla() {
        if (surukleniyor) return
        surukleniyor = true
        titret(18)
        olay("tut", JSONObject().put("x", novaP.x).put("y", novaP.y))
    }

    private val dokunma = View.OnTouchListener { _, e ->
        when (e.actionMasked) {
            MotionEvent.ACTION_DOWN -> {
                basX = e.rawX; basY = e.rawY; pX = novaP.x; pY = novaP.y; basZaman = SystemClock.uptimeMillis()
                ana.postDelayed(uzunBasma, 380)
            }
            MotionEvent.ACTION_MOVE -> {
                val dx = e.rawX - basX; val dy = e.rawY - basY
                if (!surukleniyor && hypot(dx, dy) > dp(10f)) { ana.removeCallbacks(uzunBasma); surukleBasla() }
                if (surukleniyor) {
                    novaP.x = (pX + dx).roundToInt(); novaP.y = (pY + dy).roundToInt()
                    try { wm.updateViewLayout(kap, novaP) } catch (_: Throwable) {}
                    sonPencere[0] = novaP.x; sonPencere[1] = novaP.y
                    olay("surukle", JSONObject().put("x", novaP.x).put("y", novaP.y))
                }
            }
            MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
                ana.removeCallbacks(uzunBasma)
                if (surukleniyor) {
                    surukleniyor = false
                    olay("birak", JSONObject().put("x", novaP.x).put("y", novaP.y))
                } else if (e.actionMasked == MotionEvent.ACTION_UP && abs(e.rawX - basX) < dp(10f) && abs(e.rawY - basY) < dp(10f)) {
                    val simdi = SystemClock.uptimeMillis()
                    val yer = JSONObject().put("x", e.x.toDouble()).put("y", e.y.toDouble())
                    if (simdi - sonDokunus < 300) {
                        tekBekliyor?.let { ana.removeCallbacks(it) }; tekBekliyor = null; sonDokunus = 0
                        olay("cift", yer)
                    } else {
                        sonDokunus = simdi
                        val r = Runnable { tekBekliyor = null; olay("dokun", yer) }
                        tekBekliyor = r; ana.postDelayed(r, 290)
                    }
                }
            }
        }
        true
    }

    private fun titret(ms: Long) {
        try {
            val v = getSystemService(Vibrator::class.java) ?: return
            if (Build.VERSION.SDK_INT >= 26) v.vibrate(VibrationEffect.createOneShot(ms, 60)) else @Suppress("DEPRECATION") v.vibrate(ms)
        } catch (_: Throwable) {}
    }

    // -------------------------------------------------------------- yaşam döngüsü
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            EYLEM_EVE -> { if (!gorunur) { kapat(); } else { olay("eveDon"); ana.postDelayed({ kapat() }, 9000) } }   // JS eveGirdi() ile daha erken kapatır
            EYLEM_HEMEN -> kapat()
        }
        return START_NOT_STICKY
    }

    private fun kapat() {
        if (durduruluyor) return
        stopSelf()
    }

    override fun onDestroy() {
        durduruluyor = true
        calisiyor = false
        ana.removeCallbacksAndMessages(null)
        if (IkonDurumu.dinleyici != null) IkonDurumu.dinleyici = null
        try { unregisterReceiver(ekranAlici) } catch (_: Throwable) {}
        try { if (balonEkli) wm.removeView(balon) } catch (_: Throwable) {}
        try { wm.removeView(kap) } catch (_: Throwable) {}
        try { web.resumeTimers(); web.destroy() } catch (_: Throwable) {}
        ses?.kapat()
        Gunluk.yerel("dis", "Nova eve döndü")
        super.onDestroy()
    }

    // -------------------------------------------------------------- JS köprüsü
    inner class DisKopru : NovaKopru(this@DisariServisi, ses!!, { k -> ana.post { js(k) } }) {
        @JavascriptInterface
        fun ekran(): String {
            val m = resources.displayMetrics
            fun boyut(ad: String): Int { val id = resources.getIdentifier(ad, "dimen", "android"); return if (id > 0) resources.getDimensionPixelSize(id) else 0 }
            val (w, h) = if (Build.VERSION.SDK_INT >= 30) { val b = wm.currentWindowMetrics.bounds; b.width() to b.height() } else m.widthPixels to m.heightPixels
            return JSONObject().put("w", w).put("h", h).put("yog", m.density.toDouble())
                .put("ust", boyut("status_bar_height")).put("alt", boyut("navigation_bar_height")).toString()
        }

        @JavascriptInterface
        fun simgeler(): String = IkonDurumu.json(this@DisariServisi).toString()

        @JavascriptInterface
        fun pencere(x: Int, y: Int, w: Int, h: Int) { ana.post { pencereAyarla(x, y, w, h) } }

        @JavascriptInterface
        fun balon(metin: String, x: Int, y: Int) { ana.post { balonGoster(metin, x, y) } }

        @JavascriptInterface
        fun ayar(json: String) {
            ana.post { try { heryerde = JSONObject(json).optBoolean("heryerde", false); gorunurlukGuncelle() } catch (_: Throwable) {} }
        }

        @JavascriptInterface
        fun titresim(ms: Int) { ana.post { titret(ms.toLong().coerceIn(5, 200)) } }

        @JavascriptInterface
        fun eveGirdi() { ana.post { kapat() } }

        @JavascriptInterface
        fun gorunurMu(): Boolean = gorunur
    }
}
