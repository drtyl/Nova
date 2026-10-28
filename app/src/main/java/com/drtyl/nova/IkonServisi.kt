package com.drtyl.nova

import android.accessibilityservice.AccessibilityService
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Rect
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import org.json.JSONArray
import org.json.JSONObject

/**
 * Erişilebilirlik servisi — YALNIZCA iki şey için:
 *  1) Şu an ana ekranda mıyız? (Nova yalnızca ana ekranda görünür)
 *  2) Ana ekrandaki simgelerin ve kutuların (arama çubuğu, widget) ekrandaki yerleri
 *     (Nova simgelerin üstüne oturur, arkasına saklanır, aralarında yürür)
 * Başka uygulamaların içeriğini okumaz, saklamaz, hiçbir yere göndermez: başlatıcı (launcher)
 * dışındaki pencerelerden yalnızca paket adına bakılır.
 */
class IkonServisi : AccessibilityService() {
    private val ana = Handler(Looper.getMainLooper())
    private var taramaBekliyor = false

    override fun onServiceConnected() {
        super.onServiceConnected()
        IkonDurumu.servis = this
        tarat(100)
    }

    override fun onAccessibilityEvent(e: AccessibilityEvent?) {
        val ev = e ?: return
        val pkg = ev.packageName?.toString() ?: return
        if (pkg == packageName) return                          // kendi penceremiz (Nova)
        val baslatici = IkonDurumu.baslatici(this)
        if (ev.eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
            if (pkg.contains("inputmethod") || pkg.contains("keyboard")) return
            IkonDurumu.onPlanAyarla(pkg, pkg == baslatici)
        }
        if (pkg == baslatici) tarat(250)
    }

    override fun onInterrupt() {}

    override fun onDestroy() {
        if (IkonDurumu.servis === this) IkonDurumu.servis = null
        super.onDestroy()
    }

    fun tarat(gecikme: Long) {
        if (taramaBekliyor) return
        taramaBekliyor = true
        ana.postDelayed({ taramaBekliyor = false; tara() }, gecikme)
    }

    /** Aktif pencere başlatıcıysa simgeleri topla */
    fun tara() {
        val kok = try { rootInActiveWindow } catch (_: Throwable) { null } ?: return
        val pkg = kok.packageName?.toString() ?: return
        val baslatici = IkonDurumu.baslatici(this)
        if (pkg != baslatici) { if (pkg != packageName) IkonDurumu.onPlanAyarla(pkg, false); return }
        IkonDurumu.onPlanAyarla(pkg, true)
        val yog = resources.displayMetrics.density
        val ekranW = resources.displayMetrics.widthPixels
        val simgeler = JSONArray(); val bloklar = JSONArray()
        val r = Rect()
        fun gez(n: AccessibilityNodeInfo?, derinlik: Int) {
            if (n == null || derinlik > 40) return
            if (!n.isVisibleToUser) return
            n.getBoundsInScreen(r)
            val w = r.width() / yog; val h = r.height() / yog
            val ad = (n.text ?: n.contentDescription)?.toString()?.trim() ?: ""
            val tiklanir = n.isClickable || n.isLongClickable
            var simgeMi = false
            if (tiklanir && ad.isNotEmpty() && w in 36f..150f && h in 36f..170f) {
                simgeMi = true
                simgeler.put(JSONObject().put("ad", ad.take(40)).put("x", r.left).put("y", r.top).put("w", r.width()).put("h", r.height())
                    .put("etiketli", n.text != null && n.text.isNotEmpty()))
            } else if (tiklanir && w >= 120f && h in 30f..420f && r.width() < ekranW * 1.01f) {
                bloklar.put(JSONObject().put("x", r.left).put("y", r.top).put("w", r.width()).put("h", r.height()))
            }
            if (!simgeMi) for (i in 0 until n.childCount) gez(try { n.getChild(i) } catch (_: Throwable) { null }, derinlik + 1)
        }
        gez(kok, 0)
        IkonDurumu.guncelle(simgeler, bloklar)
    }
}

/** Erişilebilirlik servisinin topladıkları; dışarıdaki Nova buradan okur. */
object IkonDurumu {
    @Volatile var servis: IkonServisi? = null
    @Volatile var anaEkranda: Boolean = true
    @Volatile var onPaket: String = ""
    @Volatile private var simgeler: JSONArray = JSONArray()
    @Volatile private var bloklar: JSONArray = JSONArray()
    @Volatile var zaman: Long = 0
    /** dinleyici: değişiklik olunca (ana iş parçacığında) */
    var dinleyici: (() -> Unit)? = null
    private var baslaticiOnbellek: String? = null
    private val ana = Handler(Looper.getMainLooper())

    fun baslatici(ctx: Context): String {
        baslaticiOnbellek?.let { return it }
        val i = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME)
        val p = try { ctx.packageManager.resolveActivity(i, PackageManager.MATCH_DEFAULT_ONLY)?.activityInfo?.packageName } catch (_: Throwable) { null }
        return (p ?: "").also { if (it.isNotEmpty() && it != "android") baslaticiOnbellek = it }
    }

    fun onPlanAyarla(pkg: String, ana_: Boolean) {
        val degisti = ana_ != anaEkranda
        onPaket = pkg; anaEkranda = ana_
        if (degisti) ana.post { dinleyici?.invoke() }
    }

    fun guncelle(s: JSONArray, b: JSONArray) {
        val degisti = s.toString() != simgeler.toString() || b.toString() != bloklar.toString()
        simgeler = s; bloklar = b; zaman = System.currentTimeMillis()
        if (degisti) ana.post { dinleyici?.invoke() }
    }

    fun json(ctx: Context): JSONObject = JSONObject()
        .put("erisim", servisAcik(ctx) && servis != null)
        .put("anaEkran", anaEkranda)
        .put("onPaket", onPaket)
        .put("simgeler", simgeler)
        .put("bloklar", bloklar)
        .put("zaman", zaman)

    fun yenile() { servis?.tarat(0) }

    fun servisAcik(ctx: Context): Boolean {
        val acik = try { Settings.Secure.getString(ctx.contentResolver, Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES) } catch (_: Throwable) { null } ?: return false
        val ben = ComponentName(ctx, IkonServisi::class.java)
        return acik.split(':').any { ComponentName.unflattenFromString(it) == ben }
    }
}
