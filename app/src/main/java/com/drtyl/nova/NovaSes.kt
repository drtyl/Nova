package com.drtyl.nova

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import android.speech.tts.Voice
import org.json.JSONArray
import org.json.JSONObject
import java.util.Locale

/**
 * Nova'nın sesi ve kulağı: TextToSpeech + SpeechRecognizer.
 * olay(ad, veri) JS'ye iletilir (window.__novaSes). Ana iş parçacığında kullanılmalı.
 */
class NovaSes(private val ctx: Context, private val olay: (String, String) -> Unit) {
    private var tts: TextToSpeech? = null
    private var ttsHazir = false
    private var recognizer: SpeechRecognizer? = null

    init {
        try {
            tts = TextToSpeech(ctx) { status ->
                if (status == TextToSpeech.SUCCESS) {
                    val t = tts ?: return@TextToSpeech
                    val r = t.setLanguage(Locale("tr", "TR"))
                    ttsHazir = r != TextToSpeech.LANG_MISSING_DATA && r != TextToSpeech.LANG_NOT_SUPPORTED
                    if (!ttsHazir) { t.setLanguage(Locale.getDefault()); ttsHazir = true }
                    t.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
                        override fun onStart(id: String?) { Kulak.mesgulAyarla("tts", true); olay("konusmaBasladi", "") }
                        override fun onDone(id: String?) { Kulak.mesgulAyarla("tts", false); olay("konusmaBitti", "") }
                        @Deprecated("eski imza")
                        override fun onError(id: String?) { Kulak.mesgulAyarla("tts", false); olay("konusmaBitti", "") }
                        override fun onError(id: String?, code: Int) { Kulak.mesgulAyarla("tts", false); olay("konusmaBitti", "") }
                    })
                    olay("seslerHazir", "")
                }
            }
        } catch (_: Throwable) { tts = null }
    }

    val var_: Boolean get() = tts != null

    fun sesler(): JSONArray {
        val arr = JSONArray()
        val t = tts
        val liste: Set<Voice> = if (t != null && ttsHazir) (t.voices ?: emptySet()) else emptySet()
        val tr = liste.filter { it.locale.language == "tr" }
        for (v in (if (tr.isNotEmpty()) tr else liste.toList()).sortedBy { it.name }) {
            arr.put(JSONObject().put("ad", v.name).put("dil", v.locale.language).put("ulke", v.locale.country)
                .put("kalite", v.quality).put("internet", v.isNetworkConnectionRequired))
        }
        return arr
    }

    fun konus(metin: String, perde: Float, hiz: Float, sesAdi: String) {
        val t = tts
        if (t == null || !ttsHazir) { olay("konusmaBitti", ""); return }
        try {
            if (sesAdi.isNotEmpty()) {
                val v = t.voices?.firstOrNull { it.name == sesAdi }
                if (v != null) t.voice = v else t.setLanguage(Locale("tr", "TR"))
            }
        } catch (_: Throwable) {}
        t.setPitch(perde)
        t.setSpeechRate(hiz)
        t.speak(metin, TextToSpeech.QUEUE_FLUSH, null, "nova-" + System.currentTimeMillis())
    }

    fun sus() { try { tts?.stop() } catch (_: Throwable) {} }

    fun mikrofonIzniVar(): Boolean = ctx.checkSelfPermission(Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED

    /** İzin yoksa izinYok() çağrılır (etkinlik izin ister; servis kullanıcıya söyler). */
    fun dinle(izinYok: () -> Unit) {
        if (!SpeechRecognizer.isRecognitionAvailable(ctx)) {
            olay("hata", "Bu telefonda konuşma tanıma servisi bulunamadı (Google uygulamasını güncellemeyi dene).")
            return
        }
        if (!mikrofonIzniVar()) { izinYok(); return }
        try {
            if (recognizer == null) {
                recognizer = SpeechRecognizer.createSpeechRecognizer(ctx).also { r ->
                    r.setRecognitionListener(object : RecognitionListener {
                        override fun onReadyForSpeech(params: Bundle?) { olay("dinliyor", "") }
                        override fun onBeginningOfSpeech() {}
                        override fun onRmsChanged(rmsdB: Float) { olay("seviye", rmsdB.toString()) }
                        override fun onBufferReceived(buffer: ByteArray?) {}
                        override fun onEndOfSpeech() { olay("dusunuyor", "") }
                        override fun onError(error: Int) { Kulak.mesgulAyarla("stt", false); olay("dinlemeHatasi", error.toString()) }
                        override fun onResults(results: Bundle?) {
                            Kulak.mesgulAyarla("stt", false)
                            val list = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                            olay("sonuc", list?.firstOrNull() ?: "")
                        }
                        override fun onPartialResults(partial: Bundle?) {
                            val t = partial?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)?.firstOrNull()
                            if (!t.isNullOrEmpty()) olay("kismi", t)
                        }
                        override fun onEvent(eventType: Int, params: Bundle?) {}
                    })
                }
            }
            val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                putExtra(RecognizerIntent.EXTRA_LANGUAGE, "tr-TR")
                putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
                putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1)
            }
            Kulak.mesgulAyarla("stt", true)
            // kulak mikrofonu bırakana kadar kısa bir bekleme (iki tanıyıcı aynı anda mikrofonu tutmasın)
            android.os.Handler(android.os.Looper.getMainLooper()).postDelayed({ try { recognizer?.startListening(intent) } catch (_: Throwable) { Kulak.mesgulAyarla("stt", false) } }, if (Kulak.servis != null) 250 else 0)
        } catch (e: Throwable) {
            olay("hata", e.message ?: "Dinleme başlatılamadı")
        }
    }

    fun dinlemeyiBirak() { try { recognizer?.stopListening() } catch (_: Throwable) {}; Kulak.mesgulAyarla("stt", false) }

    fun kapat() {
        try { tts?.stop(); tts?.shutdown() } catch (_: Throwable) {}
        try { recognizer?.destroy() } catch (_: Throwable) {}
        tts = null; recognizer = null
    }
}
