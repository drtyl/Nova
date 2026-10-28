'use strict';
/* Eklem sınırları, dinlenme pozu, hareket kütüphanesi, el şekilleri, ruh halleri. Açılar derece; sadece sağ taraf yazılır, sol aynalanır. */
const VERI = {
 "aciklama": "Açılar derece, Euler XYZ, VRM1 ekseni (karakter +Z'ye bakar). Sadece sağ taraf + gövde yazılır; sol taraf aynalanarak üretilir. Her kare bir öncekini devralır; \"dinlenme\" tam dinlenme pozudur.",
 "sinirlar": {
  "hips": [
   [
    -30,
    30
   ],
   [
    -45,
    45
   ],
   [
    -20,
    20
   ]
  ],
  "spine": [
   [
    -20,
    45
   ],
   [
    -35,
    35
   ],
   [
    -25,
    25
   ]
  ],
  "chest": [
   [
    -20,
    40
   ],
   [
    -30,
    30
   ],
   [
    -25,
    25
   ]
  ],
  "upperChest": [
   [
    -15,
    25
   ],
   [
    -20,
    20
   ],
   [
    -15,
    15
   ]
  ],
  "neck": [
   [
    -30,
    35
   ],
   [
    -50,
    50
   ],
   [
    -30,
    30
   ]
  ],
  "head": [
   [
    -40,
    40
   ],
   [
    -70,
    70
   ],
   [
    -35,
    35
   ]
  ],
  "rightShoulder": [
   [
    -15,
    15
   ],
   [
    -20,
    20
   ],
   [
    -25,
    15
   ]
  ],
  "rightUpperArm": [
   [
    -90,
    90
   ],
   [
    -60,
    120
   ],
   [
    -100,
    90
   ]
  ],
  "rightLowerArm": [
   [
    -90,
    90
   ],
   [
    -10,
    155
   ],
   [
    -155,
    10
   ]
  ],
  "rightHand": [
   [
    -80,
    80
   ],
   [
    -45,
    45
   ],
   [
    -70,
    70
   ]
  ],
  "rightUpperLeg": [
   [
    -110,
    45
   ],
   [
    -40,
    40
   ],
   [
    -45,
    15
   ]
  ],
  "rightLowerLeg": [
   [
    0,
    145
   ],
   [
    -5,
    5
   ],
   [
    -5,
    5
   ]
  ],
  "rightFoot": [
   [
    -40,
    45
   ],
   [
    -20,
    20
   ],
   [
    -20,
    20
   ]
  ],
  "rightToes": [
   [
    -30,
    30
   ],
   [
    -5,
    5
   ],
   [
    -5,
    5
   ]
  ],
  "_parmak": [
   [
    -20,
    20
   ],
   [
    -30,
    30
   ],
   [
    -10,
    95
   ]
  ],
  "_basparmak": [
   [
    -10,
    70
   ],
   [
    -50,
    30
   ],
   [
    -30,
    45
   ]
  ]
 },
 "dinlenme": {
  "simetrik": true,
  "poz": {
   "rightUpperArm": [
    0,
    0,
    72
   ],
   "rightLowerArm": [
    0,
    10,
    0
   ],
   "rightHand": [
    0,
    0,
    4
   ]
  }
 },
 "hareketler": {
  "el_salla": {
   "ad": "El salla",
   "dongu": true,
   "donem": 0.8,
   "sure": 2.4,
   "ifade": "mutlu",
   "kareler": [
    {
     "t": 0,
     "poz": {
      "rightUpperArm": [
       0,
       -15,
       5
      ],
      "rightLowerArm": [
       0,
       0,
       -75
      ],
      "head": [
       0,
       0,
       -4
      ]
     }
    },
    {
     "t": 0.5,
     "poz": {
      "rightUpperArm": [
       0,
       -15,
       5
      ],
      "rightLowerArm": [
       0,
       0,
       -115
      ],
      "head": [
       0,
       0,
       -4
      ]
     }
    },
    {
     "t": 1,
     "poz": {
      "rightUpperArm": [
       0,
       -15,
       5
      ],
      "rightLowerArm": [
       0,
       0,
       -75
      ],
      "head": [
       0,
       0,
       -4
      ]
     }
    }
   ],
   "el": {
    "sag": "acik"
   }
  },
  "selam_ver": {
   "ad": "Selam ver (eğil)",
   "sure": 2.2,
   "kareler": [
    {
     "t": 0,
     "poz": "dinlenme"
    },
    {
     "t": 0.35,
     "poz": {
      "spine": [
       18,
       0,
       0
      ],
      "chest": [
       10,
       0,
       0
      ],
      "neck": [
       8,
       0,
       0
      ],
      "head": [
       10,
       0,
       0
      ]
     }
    },
    {
     "t": 0.65,
     "poz": {
      "spine": [
       18,
       0,
       0
      ],
      "chest": [
       10,
       0,
       0
      ],
      "neck": [
       8,
       0,
       0
      ],
      "head": [
       10,
       0,
       0
      ]
     }
    },
    {
     "t": 1,
     "poz": "dinlenme"
    }
   ]
  },
  "evet": {
   "ad": "Evet (başını salla)",
   "sure": 1.4,
   "kareler": [
    {
     "t": 0,
     "poz": "dinlenme"
    },
    {
     "t": 0.25,
     "poz": {
      "head": [
       16,
       0,
       0
      ],
      "neck": [
       4,
       0,
       0
      ]
     }
    },
    {
     "t": 0.5,
     "poz": {
      "head": [
       -2,
       0,
       0
      ],
      "neck": [
       0,
       0,
       0
      ]
     }
    },
    {
     "t": 0.75,
     "poz": {
      "head": [
       16,
       0,
       0
      ],
      "neck": [
       4,
       0,
       0
      ]
     }
    },
    {
     "t": 1,
     "poz": "dinlenme"
    }
   ]
  },
  "hayir": {
   "ad": "Hayır",
   "sure": 1.5,
   "kareler": [
    {
     "t": 0,
     "poz": "dinlenme"
    },
    {
     "t": 0.2,
     "poz": {
      "head": [
       0,
       22,
       0
      ],
      "neck": [
       0,
       6,
       0
      ]
     }
    },
    {
     "t": 0.45,
     "poz": {
      "head": [
       0,
       -22,
       0
      ],
      "neck": [
       0,
       -6,
       0
      ]
     }
    },
    {
     "t": 0.7,
     "poz": {
      "head": [
       0,
       18,
       0
      ],
      "neck": [
       0,
       5,
       0
      ]
     }
    },
    {
     "t": 1,
     "poz": "dinlenme"
    }
   ]
  },
  "dusun": {
   "ad": "Düşün",
   "sure": 3.2,
   "kareler": [
    {
     "t": 0,
     "poz": "dinlenme"
    },
    {
     "t": 0.25,
     "poz": {
      "rightUpperArm": [
       0,
       50,
       62
      ],
      "rightLowerArm": [
       0,
       135,
       0
      ],
      "rightHand": [
       0,
       0,
       -20
      ],
      "head": [
       -6,
       8,
       9
      ],
      "neck": [
       0,
       0,
       4
      ]
     }
    },
    {
     "t": 0.8,
     "poz": {
      "rightUpperArm": [
       0,
       50,
       62
      ],
      "rightLowerArm": [
       0,
       135,
       0
      ],
      "rightHand": [
       0,
       0,
       -20
      ],
      "head": [
       -8,
       10,
       11
      ],
      "neck": [
       0,
       0,
       4
      ]
     }
    },
    {
     "t": 1,
     "poz": "dinlenme"
    }
   ]
  },
  "alkis": {
   "ad": "Alkışla",
   "dongu": true,
   "donem": 0.45,
   "sure": 2.2,
   "simetrik": true,
   "ifade": "mutlu",
   "kareler": [
    {
     "t": 0,
     "poz": {
      "rightUpperArm": [
       0,
       62,
       58
      ],
      "rightLowerArm": [
       0,
       95,
       0
      ]
     }
    },
    {
     "t": 0.5,
     "poz": {
      "rightUpperArm": [
       0,
       48,
       58
      ],
      "rightLowerArm": [
       0,
       85,
       0
      ]
     }
    },
    {
     "t": 1,
     "poz": {
      "rightUpperArm": [
       0,
       62,
       58
      ],
      "rightLowerArm": [
       0,
       95,
       0
      ]
     }
    }
   ],
   "el": {
    "sag": "acik",
    "sol": "acik"
   }
  },
  "el_kaldir": {
   "ad": "El kaldır",
   "sure": 2.6,
   "kareler": [
    {
     "t": 0,
     "poz": "dinlenme"
    },
    {
     "t": 0.3,
     "poz": {
      "rightUpperArm": [
       0,
       -5,
       -72
      ],
      "rightLowerArm": [
       0,
       0,
       -12
      ],
      "head": [
       0,
       0,
       -3
      ]
     }
    },
    {
     "t": 0.75,
     "poz": {
      "rightUpperArm": [
       0,
       -5,
       -72
      ],
      "rightLowerArm": [
       0,
       0,
       -12
      ],
      "head": [
       0,
       0,
       -3
      ]
     }
    },
    {
     "t": 1,
     "poz": "dinlenme"
    }
   ],
   "el": {
    "sag": "acik"
   }
  },
  "isaret": {
   "ad": "İşaret et",
   "sure": 2.6,
   "kareler": [
    {
     "t": 0,
     "poz": "dinlenme"
    },
    {
     "t": 0.3,
     "poz": {
      "rightUpperArm": [
       0,
       82,
       12
      ],
      "rightLowerArm": [
       0,
       6,
       0
      ],
      "head": [
       0,
       -10,
       0
      ]
     }
    },
    {
     "t": 0.75,
     "poz": {
      "rightUpperArm": [
       0,
       82,
       12
      ],
      "rightLowerArm": [
       0,
       6,
       0
      ],
      "head": [
       0,
       -10,
       0
      ]
     }
    },
    {
     "t": 1,
     "poz": "dinlenme"
    }
   ],
   "el": {
    "sag": "isaret"
   }
  },
  "gerin": {
   "ad": "Gerin",
   "sure": 3.0,
   "simetrik": true,
   "ifade": "rahat",
   "kareler": [
    {
     "t": 0,
     "poz": "dinlenme"
    },
    {
     "t": 0.35,
     "poz": {
      "rightUpperArm": [
       0,
       0,
       -82
      ],
      "rightLowerArm": [
       0,
       0,
       -6
      ],
      "spine": [
       -8,
       0,
       0
      ],
      "chest": [
       -6,
       0,
       0
      ],
      "head": [
       -14,
       0,
       0
      ]
     }
    },
    {
     "t": 0.7,
     "poz": {
      "rightUpperArm": [
       0,
       0,
       -84
      ],
      "rightLowerArm": [
       0,
       0,
       -4
      ],
      "spine": [
       -10,
       0,
       0
      ],
      "chest": [
       -8,
       0,
       0
      ],
      "head": [
       -16,
       0,
       0
      ]
     }
    },
    {
     "t": 1,
     "poz": "dinlenme"
    }
   ],
   "el": {
    "sag": "acik",
    "sol": "acik"
   }
  },
  "omuz_silk": {
   "ad": "Omuz silk",
   "sure": 1.9,
   "simetrik": true,
   "kareler": [
    {
     "t": 0,
     "poz": "dinlenme"
    },
    {
     "t": 0.3,
     "poz": {
      "rightShoulder": [
       0,
       0,
       -14
      ],
      "rightUpperArm": [
       0,
       22,
       62
      ],
      "rightLowerArm": [
       -60,
       80,
       0
      ],
      "head": [
       0,
       0,
       8
      ]
     }
    },
    {
     "t": 0.7,
     "poz": {
      "rightShoulder": [
       0,
       0,
       -14
      ],
      "rightUpperArm": [
       0,
       22,
       62
      ],
      "rightLowerArm": [
       -60,
       80,
       0
      ],
      "head": [
       0,
       0,
       8
      ]
     }
    },
    {
     "t": 1,
     "poz": "dinlenme"
    }
   ]
  },
  "bak": {
   "ad": "Yana bak",
   "sure": 2.4,
   "kareler": [
    {
     "t": 0,
     "poz": "dinlenme"
    },
    {
     "t": 0.25,
     "poz": {
      "head": [
       0,
       -38,
       0
      ],
      "neck": [
       0,
       -14,
       0
      ],
      "chest": [
       0,
       -5,
       0
      ]
     }
    },
    {
     "t": 0.75,
     "poz": {
      "head": [
       0,
       -38,
       0
      ],
      "neck": [
       0,
       -14,
       0
      ],
      "chest": [
       0,
       -5,
       0
      ]
     }
    },
    {
     "t": 1,
     "poz": "dinlenme"
    }
   ]
  },
  "yuru": {
   "ad": "Yerinde yürü",
   "dongu": true,
   "donem": 1.0,
   "sure": 4.0,
   "kareler": [
    {
     "t": 0,
     "poz": {
      "rightUpperLeg": [
       -38,
       0,
       0
      ],
      "rightLowerLeg": [
       55,
       0,
       0
      ],
      "leftUpperLeg": [
       0,
       0,
       0
      ],
      "rightUpperArm": [
       0,
       -22,
       72
      ],
      "leftUpperArm": [
       0,
       -22,
       -72
      ],
      "_kok": [
       0,
       -0.01,
       0
      ],
      "leftLowerLeg": [
       0,
       0,
       0
      ]
     }
    },
    {
     "t": 0.25,
     "poz": {
      "_kok": [
       0,
       -0.025,
       0
      ]
     }
    },
    {
     "t": 0.5,
     "poz": {
      "leftUpperLeg": [
       -38,
       0,
       0
      ],
      "leftLowerLeg": [
       55,
       0,
       0
      ],
      "rightUpperLeg": [
       0,
       0,
       0
      ],
      "rightUpperArm": [
       0,
       22,
       72
      ],
      "leftUpperArm": [
       0,
       22,
       -72
      ],
      "_kok": [
       0,
       -0.01,
       0
      ],
      "rightLowerLeg": [
       0,
       0,
       0
      ]
     }
    },
    {
     "t": 0.75,
     "poz": {
      "_kok": [
       0,
       -0.025,
       0
      ]
     }
    },
    {
     "t": 1,
     "poz": {
      "rightUpperLeg": [
       -38,
       0,
       0
      ],
      "rightLowerLeg": [
       55,
       0,
       0
      ],
      "leftUpperLeg": [
       0,
       0,
       0
      ],
      "rightUpperArm": [
       0,
       -22,
       72
      ],
      "leftUpperArm": [
       0,
       -22,
       -72
      ],
      "_kok": [
       0,
       -0.01,
       0
      ],
      "leftLowerLeg": [
       0,
       0,
       0
      ]
     }
    }
   ]
  },
  "zipla": {
   "ad": "Zıpla",
   "sure": 1.1,
   "ifade": "mutlu",
   "kareler": [
    {
     "t": 0,
     "poz": "dinlenme"
    },
    {
     "t": 0.22,
     "poz": {
      "_kok": [
       0,
       -0.07,
       0
      ],
      "rightUpperLeg": [
       -28,
       0,
       0
      ],
      "leftUpperLeg": [
       -28,
       0,
       0
      ],
      "rightLowerLeg": [
       52,
       0,
       0
      ],
      "leftLowerLeg": [
       52,
       0,
       0
      ],
      "rightFoot": [
       -24,
       0,
       0
      ],
      "leftFoot": [
       -24,
       0,
       0
      ],
      "spine": [
       12,
       0,
       0
      ],
      "rightUpperArm": [
       0,
       -25,
       70
      ],
      "leftUpperArm": [
       0,
       25,
       -70
      ]
     }
    },
    {
     "t": 0.45,
     "poz": {
      "_kok": [
       0,
       0.14,
       0
      ],
      "rightUpperArm": [
       0,
       0,
       48
      ],
      "leftUpperArm": [
       0,
       0,
       -48
      ],
      "rightFoot": [
       20,
       0,
       0
      ],
      "leftFoot": [
       20,
       0,
       0
      ],
      "rightUpperLeg": [
       0,
       0,
       0
      ],
      "leftUpperLeg": [
       0,
       0,
       0
      ],
      "rightLowerLeg": [
       0,
       0,
       0
      ],
      "leftLowerLeg": [
       0,
       0,
       0
      ],
      "spine": [
       0,
       0,
       0
      ]
     }
    },
    {
     "t": 0.7,
     "poz": {
      "_kok": [
       0,
       -0.05,
       0
      ],
      "rightUpperLeg": [
       -20,
       0,
       0
      ],
      "leftUpperLeg": [
       -20,
       0,
       0
      ],
      "rightLowerLeg": [
       38,
       0,
       0
      ],
      "leftLowerLeg": [
       38,
       0,
       0
      ],
      "rightFoot": [
       -18,
       0,
       0
      ],
      "leftFoot": [
       -18,
       0,
       0
      ],
      "spine": [
       8,
       0,
       0
      ]
     }
    },
    {
     "t": 1,
     "poz": "dinlenme"
    }
   ]
  },
  "dans": {
   "ad": "Dans et",
   "dongu": true,
   "donem": 1.1,
   "sure": 4.4,
   "ifade": "mutlu",
   "kareler": [
    {
     "t": 0,
     "poz": {
      "hips": [
       0,
       0,
       7
      ],
      "spine": [
       0,
       0,
       -6
      ],
      "head": [
       0,
       0,
       -6
      ],
      "rightUpperArm": [
       0,
       10,
       -35
      ],
      "rightLowerArm": [
       0,
       0,
       -55
      ],
      "leftUpperArm": [
       0,
       0,
       -55
      ],
      "leftLowerArm": [
       0,
       -70,
       0
      ],
      "_kok": [
       0.02,
       0,
       0
      ],
      "rightUpperLeg": [
       0,
       0,
       -7
      ],
      "leftUpperLeg": [
       0,
       0,
       -7
      ],
      "rightLowerLeg": [
       0,
       0,
       0
      ],
      "leftLowerLeg": [
       0,
       0,
       0
      ]
     }
    },
    {
     "t": 0.25,
     "poz": {
      "_kok": [
       0,
       -0.035,
       0
      ],
      "rightLowerLeg": [
       18,
       0,
       0
      ],
      "leftLowerLeg": [
       18,
       0,
       0
      ],
      "rightUpperLeg": [
       -9,
       0,
       0
      ],
      "leftUpperLeg": [
       -9,
       0,
       0
      ]
     }
    },
    {
     "t": 0.5,
     "poz": {
      "hips": [
       0,
       0,
       -7
      ],
      "spine": [
       0,
       0,
       6
      ],
      "head": [
       0,
       0,
       6
      ],
      "leftUpperArm": [
       0,
       -10,
       35
      ],
      "leftLowerArm": [
       0,
       0,
       55
      ],
      "rightUpperArm": [
       0,
       0,
       55
      ],
      "rightLowerArm": [
       0,
       70,
       0
      ],
      "_kok": [
       -0.02,
       0,
       0
      ],
      "rightUpperLeg": [
       0,
       0,
       7
      ],
      "leftUpperLeg": [
       0,
       0,
       7
      ],
      "rightLowerLeg": [
       0,
       0,
       0
      ],
      "leftLowerLeg": [
       0,
       0,
       0
      ]
     }
    },
    {
     "t": 0.75,
     "poz": {
      "_kok": [
       0,
       -0.035,
       0
      ],
      "rightLowerLeg": [
       18,
       0,
       0
      ],
      "leftLowerLeg": [
       18,
       0,
       0
      ],
      "rightUpperLeg": [
       -9,
       0,
       0
      ],
      "leftUpperLeg": [
       -9,
       0,
       0
      ]
     }
    },
    {
     "t": 1,
     "poz": {
      "hips": [
       0,
       0,
       7
      ],
      "spine": [
       0,
       0,
       -6
      ],
      "head": [
       0,
       0,
       -6
      ],
      "rightUpperArm": [
       0,
       10,
       -35
      ],
      "rightLowerArm": [
       0,
       0,
       -55
      ],
      "leftUpperArm": [
       0,
       0,
       -55
      ],
      "leftLowerArm": [
       0,
       -70,
       0
      ],
      "_kok": [
       0.02,
       0,
       0
      ],
      "rightUpperLeg": [
       0,
       0,
       -7
      ],
      "leftUpperLeg": [
       0,
       0,
       -7
      ],
      "rightLowerLeg": [
       0,
       0,
       0
      ],
      "leftLowerLeg": [
       0,
       0,
       0
      ]
     }
    }
   ]
  },
  "eller_belde": {
   "ad": "Eller belde",
   "sure": 3.0,
   "simetrik": true,
   "kareler": [
    {
     "t": 0,
     "poz": "dinlenme"
    },
    {
     "t": 0.3,
     "poz": {
      "rightUpperArm": [
       37.6,
       15.7,
       42.0
      ],
      "rightLowerArm": [
       23.7,
       77.0,
       9.9
      ],
      "rightHand": [
       0,
       0,
       -25
      ],
      "head": [
       0,
       0,
       -4
      ],
      "chest": [
       -4,
       0,
       0
      ]
     }
    },
    {
     "t": 0.78,
     "poz": {
      "rightUpperArm": [
       37.6,
       15.7,
       42.0
      ],
      "rightLowerArm": [
       23.7,
       77.0,
       9.9
      ],
      "rightHand": [
       0,
       0,
       -25
      ],
      "head": [
       0,
       0,
       -4
      ],
      "chest": [
       -4,
       0,
       0
      ]
     }
    },
    {
     "t": 1,
     "poz": "dinlenme"
    }
   ]
  },
  "kollari_kavustur": {
   "ad": "Kolları kavuştur",
   "sure": 3.2,
   "kareler": [
    {
     "t": 0,
     "poz": "dinlenme"
    },
    {
     "t": 0.3,
     "poz": {
      "rightUpperArm": [
       0.5,
       60.9,
       55.6
      ],
      "rightLowerArm": [
       4.0,
       89.2,
       3.9
      ],
      "leftUpperArm": [
       -2.2,
       -59.8,
       -52.6
      ],
      "leftLowerArm": [
       1.8,
       -94.7,
       -1.8
      ],
      "head": [
       2,
       0,
       5
      ]
     }
    },
    {
     "t": 0.78,
     "poz": {
      "rightUpperArm": [
       0.5,
       60.9,
       55.6
      ],
      "rightLowerArm": [
       4.0,
       89.2,
       3.9
      ],
      "leftUpperArm": [
       -2.2,
       -59.8,
       -52.6
      ],
      "leftLowerArm": [
       1.8,
       -94.7,
       -1.8
      ],
      "head": [
       2,
       0,
       5
      ]
     }
    },
    {
     "t": 1,
     "poz": "dinlenme"
    }
   ]
  },
  "asker_selami": {
   "ad": "Asker selamı",
   "sure": 2.4,
   "el": {
    "sag": "acik"
   },
   "kareler": [
    {
     "t": 0,
     "poz": "dinlenme"
    },
    {
     "t": 0.3,
     "poz": {
      "rightUpperArm": [
       17.1,
       4.6,
       -32.4
      ],
      "rightLowerArm": [
       10.1,
       5.9,
       -122.2
      ],
      "rightHand": [
       0,
       0,
       -10
      ],
      "head": [
       -3,
       0,
       0
      ]
     }
    },
    {
     "t": 0.78,
     "poz": {
      "rightUpperArm": [
       17.1,
       4.6,
       -32.4
      ],
      "rightLowerArm": [
       10.1,
       5.9,
       -122.2
      ],
      "rightHand": [
       0,
       0,
       -10
      ],
      "head": [
       -3,
       0,
       0
      ]
     }
    },
    {
     "t": 1,
     "poz": "dinlenme"
    }
   ]
  },
  "kalp": {
   "ad": "Kalp yap",
   "sure": 3.0,
   "simetrik": true,
   "ifade": "mutlu",
   "el": {
    "sag": "kalp",
    "sol": "kalp"
   },
   "kareler": [
    {
     "t": 0,
     "poz": "dinlenme"
    },
    {
     "t": 0.3,
     "poz": {
      "rightUpperArm": [
       6.6,
       -0.6,
       -70.3
      ],
      "rightLowerArm": [
       4.6,
       -3.6,
       -63.3
      ],
      "head": [
       0,
       0,
       -6
      ],
      "rightHand": [
       0,
       0,
       -10
      ]
     }
    },
    {
     "t": 0.78,
     "poz": {
      "rightUpperArm": [
       6.6,
       -0.6,
       -70.3
      ],
      "rightLowerArm": [
       4.6,
       -3.6,
       -63.3
      ],
      "head": [
       0,
       0,
       -6
      ],
      "rightHand": [
       0,
       0,
       -10
      ]
     }
    },
    {
     "t": 1,
     "poz": "dinlenme"
    }
   ]
  },
  "kutla": {
   "ad": "Kutla",
   "sure": 2.2,
   "ifade": "mutlu",
   "el": {
    "sag": "yumruk"
   },
   "kareler": [
    {
     "t": 0,
     "poz": "dinlenme"
    },
    {
     "t": 0.22,
     "poz": {
      "rightUpperArm": [
       5.2,
       2.9,
       -55.5
      ],
      "rightLowerArm": [
       2.0,
       -3.2,
       -54.3
      ],
      "head": [
       -6,
       0,
       -4
      ],
      "chest": [
       -4,
       0,
       0
      ]
     }
    },
    {
     "t": 0.4,
     "poz": {
      "rightUpperArm": [
       5,
       3,
       -30
      ],
      "rightLowerArm": [
       2,
       0,
       -95
      ],
      "_kok": [
       0,
       -0.02,
       0
      ]
     }
    },
    {
     "t": 0.58,
     "poz": {
      "rightUpperArm": [
       5.2,
       2.9,
       -55.5
      ],
      "rightLowerArm": [
       2.0,
       -3.2,
       -54.3
      ],
      "_kok": [
       0,
       0,
       0
      ]
     }
    },
    {
     "t": 0.76,
     "poz": {
      "rightUpperArm": [
       5,
       3,
       -30
      ],
      "rightLowerArm": [
       2,
       0,
       -95
      ],
      "_kok": [
       0,
       -0.02,
       0
      ]
     }
    },
    {
     "t": 0.88,
     "poz": {
      "rightUpperArm": [
       5.2,
       2.9,
       -55.5
      ],
      "rightLowerArm": [
       2.0,
       -3.2,
       -54.3
      ],
      "_kok": [
       0,
       0,
       0
      ]
     }
    },
    {
     "t": 1,
     "poz": "dinlenme"
    }
   ]
  },
  "utangac": {
   "ad": "Utangaç",
   "sure": 3.4,
   "ifade": "mutlu",
   "yogunluk": 0.45,
   "kareler": [
    {
     "t": 0,
     "poz": "dinlenme"
    },
    {
     "t": 0.25,
     "poz": {
      "rightUpperArm": [
       2.7,
       59.2,
       64.3
      ],
      "rightLowerArm": [
       10.8,
       41.3,
       10.0
      ],
      "leftUpperArm": [
       2.5,
       -58.3,
       -64.5
      ],
      "leftLowerArm": [
       7.7,
       -44.2,
       -10.0
      ],
      "head": [
       14,
       0,
       10
      ],
      "neck": [
       4,
       0,
       0
      ],
      "spine": [
       3,
       -6,
       0
      ],
      "hips": [
       0,
       8,
       0
      ]
     }
    },
    {
     "t": 0.5,
     "poz": {
      "hips": [
       0,
       -8,
       0
      ],
      "spine": [
       3,
       6,
       0
      ]
     }
    },
    {
     "t": 0.75,
     "poz": {
      "hips": [
       0,
       6,
       0
      ],
      "spine": [
       3,
       -4,
       0
      ]
     }
    },
    {
     "t": 1,
     "poz": "dinlenme"
    }
   ]
  }
 },
 "el_sekilleri": {
  "rahat": {
   "rightIndexProximal": [
    0,
    0,
    8
   ],
   "rightIndexIntermediate": [
    0,
    0,
    12
   ],
   "rightIndexDistal": [
    0,
    0,
    8
   ],
   "rightMiddleProximal": [
    0,
    0,
    12
   ],
   "rightMiddleIntermediate": [
    0,
    0,
    18
   ],
   "rightMiddleDistal": [
    0,
    0,
    12
   ],
   "rightRingProximal": [
    0,
    0,
    15
   ],
   "rightRingIntermediate": [
    0,
    0,
    20
   ],
   "rightRingDistal": [
    0,
    0,
    14
   ],
   "rightLittleProximal": [
    0,
    0,
    18
   ],
   "rightLittleIntermediate": [
    0,
    0,
    24
   ],
   "rightLittleDistal": [
    0,
    0,
    16
   ],
   "rightThumbProximal": [
    10,
    -10,
    0
   ],
   "rightThumbIntermediate": [
    15,
    0,
    0
   ],
   "rightThumbDistal": [
    10,
    0,
    0
   ]
  },
  "acik": {
   "rightIndexProximal": [
    0,
    8,
    0
   ],
   "rightIndexIntermediate": [
    0,
    0,
    0
   ],
   "rightIndexDistal": [
    0,
    0,
    0
   ],
   "rightMiddleProximal": [
    0,
    0,
    0
   ],
   "rightMiddleIntermediate": [
    0,
    0,
    0
   ],
   "rightMiddleDistal": [
    0,
    0,
    0
   ],
   "rightRingProximal": [
    0,
    -5,
    0
   ],
   "rightRingIntermediate": [
    0,
    0,
    0
   ],
   "rightRingDistal": [
    0,
    0,
    0
   ],
   "rightLittleProximal": [
    0,
    -12,
    0
   ],
   "rightLittleIntermediate": [
    0,
    0,
    0
   ],
   "rightLittleDistal": [
    0,
    0,
    0
   ],
   "rightThumbProximal": [
    0,
    -5,
    0
   ],
   "rightThumbIntermediate": [
    0,
    0,
    0
   ],
   "rightThumbDistal": [
    0,
    0,
    0
   ]
  },
  "yumruk": {
   "rightIndexProximal": [
    0,
    0,
    85
   ],
   "rightIndexIntermediate": [
    0,
    0,
    95
   ],
   "rightIndexDistal": [
    0,
    0,
    60
   ],
   "rightMiddleProximal": [
    0,
    0,
    85
   ],
   "rightMiddleIntermediate": [
    0,
    0,
    95
   ],
   "rightMiddleDistal": [
    0,
    0,
    60
   ],
   "rightRingProximal": [
    0,
    0,
    85
   ],
   "rightRingIntermediate": [
    0,
    0,
    95
   ],
   "rightRingDistal": [
    0,
    0,
    60
   ],
   "rightLittleProximal": [
    0,
    0,
    85
   ],
   "rightLittleIntermediate": [
    0,
    0,
    95
   ],
   "rightLittleDistal": [
    0,
    0,
    60
   ],
   "rightThumbProximal": [
    30,
    -35,
    0
   ],
   "rightThumbIntermediate": [
    45,
    0,
    0
   ],
   "rightThumbDistal": [
    40,
    0,
    0
   ]
  },
  "isaret": {
   "rightIndexProximal": [
    0,
    0,
    0
   ],
   "rightIndexIntermediate": [
    0,
    0,
    0
   ],
   "rightIndexDistal": [
    0,
    0,
    0
   ],
   "rightMiddleProximal": [
    0,
    0,
    85
   ],
   "rightMiddleIntermediate": [
    0,
    0,
    95
   ],
   "rightMiddleDistal": [
    0,
    0,
    60
   ],
   "rightRingProximal": [
    0,
    0,
    85
   ],
   "rightRingIntermediate": [
    0,
    0,
    95
   ],
   "rightRingDistal": [
    0,
    0,
    60
   ],
   "rightLittleProximal": [
    0,
    0,
    85
   ],
   "rightLittleIntermediate": [
    0,
    0,
    95
   ],
   "rightLittleDistal": [
    0,
    0,
    60
   ],
   "rightThumbProximal": [
    30,
    -35,
    0
   ],
   "rightThumbIntermediate": [
    45,
    0,
    0
   ],
   "rightThumbDistal": [
    40,
    0,
    0
   ]
  },
  "zafer": {
   "rightIndexProximal": [
    0,
    10,
    0
   ],
   "rightIndexIntermediate": [
    0,
    0,
    0
   ],
   "rightIndexDistal": [
    0,
    0,
    0
   ],
   "rightMiddleProximal": [
    0,
    -6,
    0
   ],
   "rightMiddleIntermediate": [
    0,
    0,
    0
   ],
   "rightMiddleDistal": [
    0,
    0,
    0
   ],
   "rightRingProximal": [
    0,
    0,
    85
   ],
   "rightRingIntermediate": [
    0,
    0,
    95
   ],
   "rightRingDistal": [
    0,
    0,
    60
   ],
   "rightLittleProximal": [
    0,
    0,
    85
   ],
   "rightLittleIntermediate": [
    0,
    0,
    95
   ],
   "rightLittleDistal": [
    0,
    0,
    60
   ],
   "rightThumbProximal": [
    30,
    -35,
    0
   ],
   "rightThumbIntermediate": [
    45,
    0,
    0
   ],
   "rightThumbDistal": [
    40,
    0,
    0
   ]
  },
  "kalp": {
   "rightIndexProximal": [
    0,
    0,
    40
   ],
   "rightIndexIntermediate": [
    0,
    0,
    45
   ],
   "rightIndexDistal": [
    0,
    0,
    30
   ],
   "rightMiddleProximal": [
    0,
    0,
    45
   ],
   "rightMiddleIntermediate": [
    0,
    0,
    50
   ],
   "rightMiddleDistal": [
    0,
    0,
    30
   ],
   "rightRingProximal": [
    0,
    0,
    50
   ],
   "rightRingIntermediate": [
    0,
    0,
    55
   ],
   "rightRingDistal": [
    0,
    0,
    35
   ],
   "rightLittleProximal": [
    0,
    0,
    55
   ],
   "rightLittleIntermediate": [
    0,
    0,
    60
   ],
   "rightLittleDistal": [
    0,
    0,
    40
   ],
   "rightThumbProximal": [
    10,
    -20,
    0
   ],
   "rightThumbIntermediate": [
    20,
    0,
    0
   ],
   "rightThumbDistal": [
    15,
    0,
    0
   ]
  }
 },
 "ruh_halleri": {
  "notr": {
   "ad": "Nötr",
   "poz": {},
   "tempo": 1
  },
  "neseli": {
   "ad": "Neşeli",
   "poz": {
    "chest": [
     -4,
     0,
     0
    ],
    "head": [
     -4,
     0,
     3
    ]
   },
   "tempo": 1.15,
   "ifade": [
    "mutlu",
    0.3
   ]
  },
  "enerjik": {
   "ad": "Enerjik",
   "poz": {
    "chest": [
     -6,
     0,
     0
    ],
    "head": [
     -3,
     0,
     0
    ],
    "rightShoulder": [
     0,
     0,
     -3
    ],
    "leftShoulder": [
     0,
     0,
     3
    ]
   },
   "tempo": 1.4,
   "zipla": true
  },
  "merakli": {
   "ad": "Meraklı",
   "poz": {
    "head": [
     -3,
     0,
     9
    ],
    "neck": [
     0,
     6,
     0
    ]
   },
   "tempo": 1.05,
   "ifade": [
    "saskin",
    0.2
   ]
  },
  "gergin": {
   "ad": "Gergin",
   "poz": {
    "rightShoulder": [
     0,
     0,
     -8
    ],
    "leftShoulder": [
     0,
     0,
     8
    ],
    "neck": [
     4,
     0,
     0
    ]
   },
   "tempo": 1.35,
   "ifade": [
    "kizgin",
    0.15
   ]
  },
  "uzgun": {
   "ad": "Üzgün",
   "poz": {
    "spine": [
     8,
     0,
     0
    ],
    "chest": [
     6,
     0,
     0
    ],
    "neck": [
     6,
     0,
     0
    ],
    "head": [
     10,
     0,
     0
    ],
    "rightShoulder": [
     0,
     0,
     6
    ],
    "leftShoulder": [
     0,
     0,
     -6
    ]
   },
   "tempo": 0.7,
   "ifade": [
    "uzgun",
    0.45
   ]
  },
  "yorgun": {
   "ad": "Yorgun",
   "poz": {
    "spine": [
     6,
     0,
     3
    ],
    "head": [
     8,
     0,
     6
    ],
    "rightShoulder": [
     0,
     0,
     4
    ],
    "leftShoulder": [
     0,
     0,
     -4
    ]
   },
   "tempo": 0.6,
   "ifade": [
    "rahat",
    0.35
   ]
  }
 }
};
