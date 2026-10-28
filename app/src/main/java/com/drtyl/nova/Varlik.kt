package com.drtyl.nova

import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.webkit.ConsoleMessage
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient

/**
 * Uygulamanın web dosyalarını (assets/www) https://nova.yerel/ adresinden sunar.
 * Hem ana ekran (MainActivity) hem dışarıdaki küçük Nova (DisariServisi) aynı adresi kullanır;
 * böylece ikisi aynı kalıcı depoyu (localStorage) paylaşır.
 */
object Varlik {
    const val ALAN = "nova.yerel"
    private val TURLER = mapOf(
        "html" to "text/html", "js" to "text/javascript", "mjs" to "text/javascript", "css" to "text/css",
        "json" to "application/json", "png" to "image/png", "jpg" to "image/jpeg", "jpeg" to "image/jpeg",
        "webp" to "image/webp", "svg" to "image/svg+xml", "wasm" to "application/octet-stream",
        "vrm" to "application/octet-stream", "glb" to "application/octet-stream", "txt" to "text/plain"
    )

    fun yanit(ctx: Context, request: WebResourceRequest): WebResourceResponse? {
        val u = request.url
        if (u.host != ALAN) return null
        var yol = (u.path ?: "/").trimStart('/')
        if (yol.isEmpty()) yol = "index.html"
        val uzanti = yol.substringAfterLast('.', "").lowercase()
        val tur = TURLER[uzanti] ?: "application/octet-stream"
        return try {
            val akis = ctx.assets.open("www/$yol")
            WebResourceResponse(tur, if (tur.startsWith("text/") || tur == "application/json") "utf-8" else null, akis).apply {
                responseHeaders = mapOf("Access-Control-Allow-Origin" to "*", "Cache-Control" to "no-cache")
            }
        } catch (e: Exception) {
            WebResourceResponse("text/plain", "utf-8", 404, "Yok", mapOf(), "".byteInputStream())
        }
    }

    /** Ortak WebView ayarları; etiket, konsol günlüğünde hangi pencereden geldiğini gösterir. */
    @SuppressLint("SetJavaScriptEnabled")
    fun kur(ctx: Context, web: WebView, etiket: String, disLinkleriAc: Boolean) {
        with(web.settings) {
            javaScriptEnabled = true
            domStorageEnabled = true
            mediaPlaybackRequiresUserGesture = false
            textZoom = 100
        }
        web.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? = yanit(ctx, request)
            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                if (request.url.host == ALAN) return false
                val url = request.url.toString()
                if (disLinkleriAc && (url.startsWith("http://") || url.startsWith("https://"))) {
                    try { ctx.startActivity(Intent(Intent.ACTION_VIEW, request.url).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)) } catch (_: Exception) {}
                }
                return true
            }
        }
        web.webChromeClient = object : WebChromeClient() {
            override fun onConsoleMessage(msg: ConsoleMessage): Boolean {
                android.util.Log.d("NovaJS-$etiket", "${msg.message()} @${msg.sourceId()}:${msg.lineNumber()}")
                Gunluk.ekle(etiket, msg)
                return true
            }
        }
    }
}

/** Hata günlüğü: JS konsolundaki hata/uyarılar dosyaya da yazılır (Ayarlar → Günlük). */
object Gunluk {
    private val satirlar = ArrayDeque<String>()
    @Synchronized fun ekle(etiket: String, m: ConsoleMessage) {
        if (m.messageLevel() != ConsoleMessage.MessageLevel.ERROR && m.messageLevel() != ConsoleMessage.MessageLevel.WARNING) return
        val zaman = java.text.SimpleDateFormat("dd.MM HH:mm:ss", java.util.Locale.ROOT).format(java.util.Date())
        satirlar.addLast("$zaman [$etiket] ${m.messageLevel().name.lowercase()}: ${m.message()} (${m.sourceId().substringAfterLast('/')}:${m.lineNumber()})")
        while (satirlar.size > 200) satirlar.removeFirst()
    }
    @Synchronized fun yerel(etiket: String, metin: String) {
        val zaman = java.text.SimpleDateFormat("dd.MM HH:mm:ss", java.util.Locale.ROOT).format(java.util.Date())
        satirlar.addLast("$zaman [$etiket] $metin")
        while (satirlar.size > 200) satirlar.removeFirst()
    }
    @Synchronized fun hepsi(): String = satirlar.joinToString("\n")
    @Synchronized fun temizle() = satirlar.clear()
}
