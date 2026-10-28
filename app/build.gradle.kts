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
        versionCode = 2
        versionName = "2.0"
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

// Bilerek hiçbir ek kütüphane yok: daha az bağımlılık = daha az çökme.
dependencies {
}
