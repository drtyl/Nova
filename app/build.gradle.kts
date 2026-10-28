plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.drtyl.nova"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.drtyl.nova"
        minSdk = 26
        targetSdk = 34
        versionCode = 3
        versionName = "2.1"
        // ses tanıma kütüphanesinin yalnızca telefon işlemcileri için olanları (APK küçük kalsın)
        ndk { abiFilters += listOf("arm64-v8a", "armeabi-v7a") }
    }

    // Sabit imza: her derleme aynı anahtarla imzalanır, böylece yeni APK eskisinin ÜSTÜNE kurulur
    // (verilerin — hafıza, kıyafetler, oda — silinmez). Kişisel kullanım içindir; Play Store'a
    // gönderilecekse anahtar gizli tutulmalı (GitHub Secrets).
    signingConfigs {
        create("nova") {
            storeFile = file("nova.keystore")
            storePassword = "novanova"
            keyAlias = "nova"
            keyPassword = "novanova"
        }
    }

    buildTypes {
        getByName("debug") {
            signingConfig = signingConfigs.getByName("nova")
        }
        release {
            isMinifyEnabled = false
            signingConfig = signingConfigs.getByName("nova")
        }
    }

    // derlemeyi lint uyarıları yüzünden durdurma (kişisel uygulama)
    lint {
        checkReleaseBuilds = false
        abortOnError = false
    }

    // model ve dokular sıkıştırılmadan paketlensin (hızlı açılış)
    androidResources {
        noCompress += listOf("wasm", "jpg", "png")
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
}

// Tek ek kütüphane: Vosk (telefonda, internetsiz Türkçe ses tanıma — "Nova ses ver")
dependencies {
    implementation("net.java.dev.jna:jna:5.13.0@aar")
    implementation("com.alphacephei:vosk-android:0.3.47@aar")
}
