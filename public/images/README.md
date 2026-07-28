# صور الموقع

| المجلّد | ما يوضع فيه | يُذكر في |
|---|---|---|
| `sections/` | صورة كل قسم (ببجي · eFootball · تيك توك · إلكترونيات) | `lib/content.ts` ← `sections` ← `img` |
| `pubg/` | صور باقات الشدات | `lib/data.ts` ← `pubg` ← `img` |
| `efootball/` | صور باقات الكوينز | `lib/data.ts` ← `icons` ← `img` |
| `tiktok/` | صور حسابات تيك توك | `lib/data.ts` ← `tiktok` ← `img` |
| `accounts/` | صور حسابات eFootball | `lib/data.ts` ← `accounts` ← `img` |
| `elec/` | صور الإلكترونيات | `lib/data.ts` ← `elec` ← `img` |
| `slides/` | صور البانر المتحرّك | `lib/content.ts` ← `slides` ← `img` |
| `pay/` | شعارات وسائل الدفع | `lib/data.ts` ← `pay` ← `logo` |

مثال:

    { id: "u3", amount: 660, price: 10.5, img: "/images/pubg/660.png" }

**المقاس:** مربّعة ٦٠٠×٦٠٠ بكسل فأكثر لبطاقات الباقات والأقسام.
بلا صورة لا ينكسر شيء — تظهر الأيقونة بدلاً منها.
