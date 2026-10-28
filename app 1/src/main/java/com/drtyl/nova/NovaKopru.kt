package com.drtyl.nova

import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.BatteryManager
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.util.Base64
import android.webkit.JavascriptInterface
import org.json.JSONObject
import java.io.File
import java.net.HttpURLConnection
import java.net.URL

/**
 * JS'nin gördüğü ortak köprü (window.NovaNative): kalıcı depo, internet isteği, ses, durum bilgileri.
 * Ana ekran ve dışarıdaki Nova bunu genişletir.
 */
open class NovaKopru(
    protected val ctx: Context,
    protected val ses: NovaSes,
    /** JS çalıştır (ana iş parçacığında) */
    protected val js: (String) -> Unit,
) {
    protected val main = Handler(Looper.getMainLooper())
    private val kok = File(ctx.filesDir, "nova").apply { mkdirs() }

    private fun guvenli(yol: String): File {
        val f = File(kok, yol.trimStart('/')).canonicalFile
        val r = kok.canonicalFile
        if (f != r && !f.path.startsWith(r.path + File.separator)) throw SecurityException("Depo dışına çıkılamaz: $yol")
        return f
    }

    protected fun ok(veri: Any? = null): String = JSONObject().put("ok", true).put("data", veri ?: JSONObject.NULL).toString()
    protected fun hata(e: Throwable): String = JSONObject().put("ok", false).put("error", e.message ?: e.toString()).toString()

    // ---- kalıcı depo (yedekler)
    @JavascriptInterface
    fun oku(yol: String): String = try { val f = guvenli(yol); ok(if (f.exists()) f.readText(Charsets.UTF_8) else null) } catch (e: Throwable) { hata(e) }

    @JavascriptInterface
    fun yaz(yol: String, metin: String): String = try {
        val f = guvenli(yol); f.parentFile?.mkdirs()
        val gecici = File(f.path + ".yeni"); gecici.writeText(metin, Charsets.UTF_8)
        if (!gecici.renameTo(f)) { f.writeText(metin, Charsets.UTF_8); gecici.delete() }
        ok()
    } catch (e: Throwable) { hata(e) }

    @JavascriptInterface
    fun sil(yol: String): String = try { guvenli(yol).deleteRecursively(); ok() } catch (e: Throwable) { hata(e) }

    // ---- internet isteği (yapay zekâ). Sonuç: window.__novaHttpDone(id, durum, base64)
    @JavascriptInterface
    fun http(id: String, url: String, method: String, headersJson: String, body: String) {
        Thread {
            var durum = 0
            var metin: String
            try {
                val c = URL(url).openConnection() as HttpURLConnection
                c.requestMethod = method
                c.connectTimeout = 20000
                c.readTimeout = 90000
                val h = JSONObject(headersJson)
                val anahtarlar = h.keys()
                while (anahtarlar.hasNext()) { val k = anahtarlar.next(); c.setRequestProperty(k, h.getString(k)) }
                if (method != "GET" && body.isNotEmpty()) {
                    c.doOutput = true
                    c.outputStream.use { it.write(body.toByteArray(Charsets.UTF_8)) }
                }
                durum = c.responseCode
                val akis = if (durum in 200..299) c.inputStream else c.errorStream
                metin = akis?.bufferedReader(Charsets.UTF_8)?.use { it.readText() } ?: ""
            } catch (e: Throwable) {
                metin = e.message ?: e.toString()
            }
            val b64 = Base64.encodeToString(metin.toByteArray(Charsets.UTF_8), Base64.NO_WRAP)
            main.post { js("window.__novaHttpDone && window.__novaHttpDone('$id',$durum,'$b64')") }
        }.start()
    }

    // ---- ses
    @JavascriptInterface
    fun sesVar(): Boolean = ses.var_

    @JavascriptInterface
    fun sesler(): String = try { ok(ses.sesler()) } catch (e: Throwable) { hata(e) }

    @JavascriptInterface
    fun konus(metin: String, perde: Float, hiz: Float, sesAdi: String) { main.post { ses.konus(metin, perde, hiz, sesAdi) } }

    @JavascriptInterface
    fun sus() { main.post { ses.sus() } }

    @JavascriptInterface
    open fun dinle() { main.post { ses.dinle { js("window.__novaSes && window.__novaSes('hata','Mikrofon izni yok. Nova uygulamasını açıp bir kez mikrofona dokun.')") } } }

    @JavascriptInterface
    fun dinlemeyiBirak() { main.post { ses.dinlemeyiBirak() } }

    // ---- durum
    @JavascriptInterface
    fun pil(): String = try {
        val i = ctx.registerReceiver(null, IntentFilter(Intent.ACTION_BATTERY_CHANGED))
        val seviye = i?.getIntExtra(BatteryManager.EXTRA_LEVEL, -1) ?: -1
        val olcek = i?.getIntExtra(BatteryManager.EXTRA_SCALE, 100) ?: 100
        val durum = i?.getIntExtra(BatteryManager.EXTRA_STATUS, -1) ?: -1
        val sarj = durum == BatteryManager.BATTERY_STATUS_CHARGING || durum == BatteryManager.BATTERY_STATUS_FULL
        ok(JSONObject().put("yuzde", if (seviye >= 0) seviye * 100 / olcek else -1).put("sarj", sarj))
    } catch (e: Throwable) { hata(e) }

    /** Dışarı çıkma ile ilgili izinler ve durum */
    @JavascriptInterface
    fun disariDurumu(): String = try {
        ok(JSONObject()
            .put("ustteGoster", Settings.canDrawOverlays(ctx))
            .put("erisim", IkonDurumu.servisAcik(ctx))
            .put("mikrofon", ses.mikrofonIzniVar())
            .put("disarida", DisariServisi.calisiyor))
    } catch (e: Throwable) { hata(e) }

    // ---- telefonda iş yap (Telefon.kt). Sonuç: window.__novaTelefon(id, json)
    @JavascriptInterface
    fun telefon(id: String, json: String) {
        main.post {
            val r = try { Telefon.calistir(ctx, JSONObject(json)) } catch (e: Throwable) { JSONObject().put("ok", false).put("mesaj", e.message ?: "hata") }
            js("window.__novaTelefon && window.__novaTelefon('$id',$r)")
        }
    }

    /** izin iste (yalnızca uygulama açıkken); sonuç: window.__novaIzin(izin, verildi) */
    @JavascriptInterface
    open fun izinIste(izin: String) { main.post { js("window.__novaIzin && window.__novaIzin('$izin',false)") } }

    // ---- kulak ("Nova ses ver")
    @JavascriptInterface
    fun kulakDurumu(): String = ok(JSONObject().put("acik", Kulak.acikMi(ctx)).put("ifade", Kulak.ifade(ctx)).put("durum", Kulak.durum)
        .put("calisiyor", Kulak.servis != null).put("son", Kulak.sonDuyulan).put("mikrofon", ses.mikrofonIzniVar())
        .put("pilKisitsiz", try { (ctx.getSystemService(android.os.PowerManager::class.java))?.isIgnoringBatteryOptimizations(ctx.packageName) == true } catch (_: Throwable) { false })
        .put("ustteGoster", Settings.canDrawOverlays(ctx)).put("xiaomi", Build.MANUFACTURER.lowercase().let { it.contains("xiaomi") || it.contains("redmi") || it.contains("poco") }))

    @JavascriptInterface
    open fun kulakAyarla(acik: Boolean, ifade: String) { main.post { Kulak.ayarla(ctx, acik, ifade) } }

    @JavascriptInterface
    fun gunluk(): String = Gunluk.hepsi()

    @JavascriptInterface
    fun gunlukTemizle() { Gunluk.temizle() }

    @JavascriptInterface
    fun surum(): String = "2.0"
}
