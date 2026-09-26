// Nico's "90's vs 2000's" Spotify playlist, shown on the inspectable iPod's
// screen (screen.ts). Snapshotted from
// https://open.spotify.com/playlist/5kJB1LmcMnfBcJCZiDVWso rather than
// fetched live — it's decoration, not worth a Spotify API call per visit.
// Remaster/edit suffixes stripped so titles fit the tiny screen.
export interface IpodTrack {
  title: string
  artist: string
  /** seconds */
  duration: number
  /** Spotify's ~30 s preview, id on SPOTIFY_PREVIEW_BASE */
  preview: string
}

// Nico picked Spotify's own preview clips as the iPod's audio (served from
// Spotify's CDN, never copied into the repo). The ids come from the same
// embed page as the tracklist, not a stable public API — they can change
// or stop resolving; the iPod just stays silent if one fails to load.
export const SPOTIFY_PREVIEW_BASE = "https://p.scdn.co/mp3-preview/"

export const IPOD_PLAYLIST_NAME = "90's vs 2000's"

export const IPOD_TRACKS: IpodTrack[] = [
  {
    title: "Closing Time",
    artist: "Semisonic",
    duration: 274,
    preview: "a37f72b06f19632f5174eed3e0ce8b305556e976"
  },
  {
    title: "No Rain",
    artist: "Blind Melon",
    duration: 217,
    preview: "7c1423cf3b8e381b1ace65eebcc412d48bd37b87"
  },
  {
    title: "Mr. Jones",
    artist: "Counting Crows",
    duration: 273,
    preview: "276d59038d8c3c33477649a5851b00a2b5f85ae2"
  },
  {
    title: "Southern Girl",
    artist: "Incubus",
    duration: 221,
    preview: "aaa4a60ffb4789e9926b51a3b8776092642a39c1"
  },
  {
    title: "Semi-Charmed Life",
    artist: "Third Eye Blind",
    duration: 268,
    preview: "3c46a9f2954735cab673dd930ddc7d5e1a2fd1f5"
  },
  {
    title: "Every Morning",
    artist: "Sugar Ray",
    duration: 220,
    preview: "f16a483caa447177d2d57ece81496e5ab81005e4"
  },
  {
    title: "Secret Smile",
    artist: "Semisonic",
    duration: 276,
    preview: "31d11fc923cb92fd0fc7fb04932c6b7da96033bb"
  },
  {
    title: "Mexico",
    artist: "Incubus",
    duration: 259,
    preview: "c53bd825407b100b91c14ff371aba5a02b5de8be"
  },
  {
    title: "Fly",
    artist: "Sugar Ray",
    duration: 245,
    preview: "97fab2a5f6c5cc2f93785cb083f8bdfef8f47b64"
  },
  {
    title: "Jumper",
    artist: "Third Eye Blind",
    duration: 273,
    preview: "e9a068781238301eee19edbc7cc447d278a9df87"
  },
  {
    title: "Summer Romance (Anti-Gravity Love Song)",
    artist: "Incubus",
    duration: 266,
    preview: "ddd172f8cfd232e3264782ee33293e39c9edd590"
  },
  {
    title: "Absolutely (Story of a Girl)",
    artist: "Nine Days",
    duration: 189,
    preview: "863bb2c3649e37fa86dad22b4e4da05012a59a5a"
  },
  {
    title: "When It's Over",
    artist: "Sugar Ray",
    duration: 218,
    preview: "7e80452d8a0b18ca7d4609a4dca3896e5f988969"
  },
  {
    title: "I Miss You",
    artist: "Incubus",
    duration: 169,
    preview: "c80fe3da2b8b052a4b0c39267c21cab9c113a87b"
  },
  {
    title: "Bitter Sweet Symphony",
    artist: "The Verve",
    duration: 358,
    preview: "8b56a0a99ec6675ac20c4c9d69565897e510c491"
  },
  {
    title: "Higher",
    artist: "Creed",
    duration: 317,
    preview: "cd38d3d55bda0fc1c8e8be9a7f9198999fad7b95"
  },
  {
    title: "Island In The Sun",
    artist: "Weezer",
    duration: 200,
    preview: "521139742aef149a3d58924c1e9dd6f1ff6b816a"
  },
  {
    title: "One Last Breath",
    artist: "Creed",
    duration: 238,
    preview: "20dd8d3794a1715078dd9c7767ad8aa53f9c8260"
  },
  {
    title: "Shine",
    artist: "Collective Soul",
    duration: 306,
    preview: "ae8d1b31dd468740649e6336fbf493fca3fe7c29"
  },
  {
    title: "One",
    artist: "Creed",
    duration: 303,
    preview: "16c353e4fd82b312be02bc959d05659370c8e817"
  },
  {
    title: "You Get What You Give",
    artist: "New Radicals",
    duration: 301,
    preview: "f60a92f1f0759c66eb1092cd6cd09aab791a6518"
  },
  {
    title: "My Sacrifice",
    artist: "Creed",
    duration: 295,
    preview: "6bd8890cc20262f03cb5601dd8a780472a397242"
  },
  {
    title: "Kryptonite",
    artist: "3 Doors Down",
    duration: 234,
    preview: "55c8389bc8dfbe118e97ecd05f027e9ad59cd99d"
  },
  {
    title: "Under The Bridge",
    artist: "Red Hot Chili Peppers",
    duration: 266,
    preview: "46b0229c06712c5b5e143724c0617e51a9b6e432"
  },
  {
    title: "With Arms Wide Open",
    artist: "Creed",
    duration: 235,
    preview: "ca3c6b7def53f3a5d445c4eb1c73f7589eb3d4fa"
  },
  {
    title: "What's My Age Again?",
    artist: "blink-182",
    duration: 149,
    preview: "e73273f1d5a2b8d94dcd54d9f1a90e636e8c24bf"
  },
  {
    title: "Learn to Fly",
    artist: "Foo Fighters",
    duration: 235,
    preview: "410537fea88c9d30eb7642d14f4658dd9b34afec"
  },
  {
    title: "Shiny Happy People",
    artist: "R.E.M.",
    duration: 226,
    preview: "e2a6898f50a8fc0166fcab561da060ba0c2eec93"
  },
  {
    title: "In the Meantime",
    artist: "Spacehog",
    duration: 300,
    preview: "20b0baa4734aebedaf91ce392e0f1f1dd92c106b"
  },
  {
    title: "Wherever You Will Go",
    artist: "The Calling",
    duration: 209,
    preview: "ec2294caf17225c2bcaa613507443f1539a91a47"
  },
  {
    title: "How You Remind Me",
    artist: "Nickelback",
    duration: 224,
    preview: "94fd201045f5b682935957a8206075638dc4622d"
  },
  {
    title: "Losing My Religion",
    artist: "R.E.M.",
    duration: 269,
    preview: "184d86f6c2b531830190011f00c5780fa7a2e1f2"
  },
  {
    title: "Here Without You",
    artist: "3 Doors Down",
    duration: 239,
    preview: "9b68307f4204ff0342561d75a6c48312abb3e0d3"
  },
  {
    title: "Smells Like Teen Spirit",
    artist: "Nirvana",
    duration: 302,
    preview: "91219ebc0d0505a1001c4b854f8b2451fcec95b8"
  },
  {
    title: "Wish You Were Here",
    artist: "Incubus",
    duration: 213,
    preview: "3c423190127a2748aad13610df1d44a36f45c956"
  },
  {
    title: "Creep",
    artist: "Radiohead",
    duration: 239,
    preview: "f3d864283774529a2378100c912bfacb614db751"
  },
  {
    title: "In Too Deep",
    artist: "Sum 41",
    duration: 207,
    preview: "1e873fa3bece43233494ace8846c210b2648f9d1"
  },
  {
    title: "Drive",
    artist: "Incubus",
    duration: 232,
    preview: "7948a397a8d6e2e9d37ea4827235fbe254463b66"
  },
  {
    title: "Black Hole Sun",
    artist: "Soundgarden",
    duration: 319,
    preview: "a784f804a7d9d93c369347eae4872945e5cb9398"
  },
  {
    title: "Otherside",
    artist: "Red Hot Chili Peppers",
    duration: 255,
    preview: "90076510970ced8308b85cd65776f75b99d97e7f"
  },
  {
    title: "Don't Look Back in Anger",
    artist: "Oasis",
    duration: 290,
    preview: "301d7cedf05cdfd0fcd036f184c3a7dcab26d0cd"
  },
  {
    title: "Basket Case",
    artist: "Green Day",
    duration: 182,
    preview: "f055a866d726bac8593f15953d772c631505df7e"
  },
  {
    title: "Blurry",
    artist: "Puddle Of Mudd",
    duration: 304,
    preview: "5efad23df035c2607a70689342d0c426bb02e43d"
  },
  {
    title: "When I Come Around",
    artist: "Green Day",
    duration: 178,
    preview: "ce95ec4b7666e7efe290782e449bd96ba8f7a4e5"
  },
  {
    title: "The World I Know",
    artist: "Collective Soul",
    duration: 255,
    preview: "2726b1be74183d3bbe937e2211294c4c38f67fbd"
  },
  {
    title: "My Own Prison",
    artist: "Creed",
    duration: 299,
    preview: "e2c3b1b1c23fc0ae6fdc8b2a7f37b1d8a128e74d"
  },
  {
    title: "Fake Plastic Trees",
    artist: "Radiohead",
    duration: 291,
    preview: "3ee9bf807973f08aeb2e2b7578e0e4b8e58e513e"
  },
  {
    title: "Deep Inside of You",
    artist: "Third Eye Blind",
    duration: 251,
    preview: "a2f6c2908e76904360d8e1be10cc1097448550ea"
  },
  {
    title: "Imitation Of Life",
    artist: "R.E.M.",
    duration: 238,
    preview: "09cf975c93f79e25b6e5e4c4d860e80e198577c2"
  },
  {
    title: "High And Dry",
    artist: "Radiohead",
    duration: 257,
    preview: "ae7ca2c6a3471d6b591ad0d1d0f83dc311afd1c4"
  },
  {
    title: "Sunday Morning",
    artist: "No Doubt",
    duration: 273,
    preview: "ac433b486f894f7a49d206df7d0c32887352a2ab"
  },
  {
    title: "Butterfly",
    artist: "Crazy Town",
    duration: 217,
    preview: "9d3bbc954641720af57379d0ef40a9e3dd807335"
  },
  {
    title: "Ana's Song (Open Fire)",
    artist: "Silverchair",
    duration: 222,
    preview: "76e53e707ed6a7ab2e4f842d245f01b8b7161059"
  },
  {
    title: "Just A Girl",
    artist: "No Doubt",
    duration: 209,
    preview: "1cd97aefe74cf314ed91011a50adec3cc4e81918"
  },
  {
    title: "Perhaps, Perhaps, Perhaps",
    artist: "CAKE",
    duration: 144,
    preview: "59fddd612697488a4bedbc59fe56249eac854fd5"
  },
  {
    title: "Easy",
    artist: "Faith No More",
    duration: 187,
    preview: "1f75947e13fe58dba48b2fd8d5f0b79db8358962"
  },
  {
    title: "I Will Survive",
    artist: "CAKE",
    duration: 310,
    preview: "542c545b03b2afda78782b5ddd0b72a307e7ab30"
  },
  {
    title: "Someday",
    artist: "Sugar Ray",
    duration: 243,
    preview: "1419be28e1fa3093ad76a9ab594cbde45104183a"
  },
  {
    title: "Say It Ain't So",
    artist: "Weezer",
    duration: 259,
    preview: "17adc497b3bfb73e83cf713f1dd6b9a711abb59b"
  },
  {
    title: "Only Wanna Be with You",
    artist: "Hootie & The Blowfish",
    duration: 230,
    preview: "c5721a9c5e5e9333a254cae05598f6165ea58cd0"
  },
  {
    title: "Under the Sun",
    artist: "Sugar Ray",
    duration: 201,
    preview: "98e805b7c0410c329deb4c3cba53b1141163fe60"
  },
  {
    title: "Mmm Mmm Mmm Mmm",
    artist: "Crash Test Dummies",
    duration: 233,
    preview: "9c0f2b94c3c85fc12c085e439ac0d8c8fef096fe"
  },
  {
    title: "One Headlight",
    artist: "The Wallflowers",
    duration: 313,
    preview: "6b0a1c1ab240bd452e9645e6a495b6fc32000a46"
  },
  {
    title: "Brick",
    artist: "Ben Folds Five",
    duration: 272,
    preview: "6cd41e7da8797ad14afb22a9bcaf73f297be905f"
  },
  {
    title: "Army",
    artist: "Ben Folds Five",
    duration: 203,
    preview: "8d9fb7ddd475602851a99ea937f183e8b886400a"
  },
  {
    title: "What I Got",
    artist: "Sublime",
    duration: 171,
    preview: "b6192a50395f8ce30b5453a6c010d7b83a035280"
  },
  {
    title: "3AM",
    artist: "Matchbox Twenty",
    duration: 226,
    preview: "996010e7c4708a83df98a6c8a131794970e48f9b"
  },
  {
    title: "Santeria",
    artist: "Sublime",
    duration: 183,
    preview: "9bd14340e2c557e2e9cdc454f0820b20dd48100e"
  },
  {
    title: "Coffee & TV",
    artist: "Blur",
    duration: 359,
    preview: "ee9014df72f64be9d707045a6469a07a58c1c1cf"
  },
  {
    title: "Alright",
    artist: "Supergrass",
    duration: 181,
    preview: "703b2e6ea8107e94ea1b022364a059a8324faef5"
  },
  {
    title: "Beetlebum",
    artist: "Blur",
    duration: 305,
    preview: "b0534cefa06f4879486aad8e06924e0a115b4c56"
  },
  {
    title: "If You Could Only See",
    artist: "Tonic",
    duration: 262,
    preview: "a1d19fd170b1e8e233c7368e832f8e601ef4507b"
  },
  {
    title: "6th Avenue Heartache",
    artist: "The Wallflowers",
    duration: 337,
    preview: "fccf64c2b94c71dcc96918362c9b6ac50e38d064"
  },
  {
    title: "Til I Hear It From You",
    artist: "Gin Blossoms",
    duration: 229,
    preview: "f38ad94b2d689fd112958c3731d807d55f6d6fbf"
  },
  {
    title: "The Difference",
    artist: "The Wallflowers",
    duration: 230,
    preview: "8c6a66a865b271fc01e5f9d187f123f5035b21ac"
  },
  {
    title: "Runaway Train",
    artist: "Soul Asylum",
    duration: 267,
    preview: "3fd29b37fc76443f0565310269be89ce0e22aec7"
  },
  {
    title: "Never There",
    artist: "CAKE",
    duration: 164,
    preview: "6b6c638eadf028e3bb37bf72356b680cebb83960"
  },
  {
    title: "Thinking About You",
    artist: "Radiohead",
    duration: 162,
    preview: "6af0dabf919ae5af1f5c91b85f0bfa801f18e898"
  },
  {
    title: "Just Looking",
    artist: "Stereophonics",
    duration: 253,
    preview: "c270563913a798cfdef84ab7150e152979b875cb"
  },
  {
    title: "Karma Police",
    artist: "Radiohead",
    duration: 264,
    preview: "0c770be37583bbf7f7da3febeb2bf11d1a621a80"
  },
  {
    title: "A Thousand Trees",
    artist: "Stereophonics",
    duration: 183,
    preview: "8e0b84fa3ae7a2e853bce86bc39a25453b4eb073"
  },
  {
    title: "She's Electric",
    artist: "Oasis",
    duration: 221,
    preview: "6a5684c6e240385f73efad4f423b0737ea3d86de"
  },
  {
    title: "1979",
    artist: "The Smashing Pumpkins",
    duration: 266,
    preview: "5c2f38c90920f9d3db3784bc0205cf24ec7a1abe"
  },
  {
    title: "Push",
    artist: "Matchbox Twenty",
    duration: 239,
    preview: "284cee953196606bcbb22d6d7f3315f4fc5fc22b"
  },
  {
    title: "Good Riddance (Time of Your Life)",
    artist: "Green Day",
    duration: 153,
    preview: "25e3289a356f376e09cc0089de4fcff05f1ec838"
  },
  {
    title: "Big Me",
    artist: "Foo Fighters",
    duration: 133,
    preview: "e6b7ad383be6535548ed2dd0709e3ff724910e3c"
  },
  {
    title: "Last Kiss",
    artist: "Pearl Jam",
    duration: 195,
    preview: "083e2353ef0b32995c84626204cca20ae0f704e0"
  },
  {
    title: "Lucky Man",
    artist: "The Verve",
    duration: 293,
    preview: "68cee02740271f07a9cbc7ef65a31194b91206c5"
  },
  {
    title: "Can't Change Me",
    artist: "Chris Cornell",
    duration: 202,
    preview: "83f4c8177fc912211346b9361afc01c36e28c2b5"
  },
  {
    title: "Never Let You Go",
    artist: "Third Eye Blind",
    duration: 237,
    preview: "3ddbcbb2cf96406c1d0caeb042e444c0770e608e"
  },
  {
    title: "My Friends",
    artist: "Red Hot Chili Peppers",
    duration: 249,
    preview: "ceeb74dfa5c9d86727475e3faf116449da1bb5ca"
  },
  {
    title: "Friday I'm in Love",
    artist: "The Cure",
    duration: 214,
    preview: "d577955738fc95b2aa5746f5394c8bf0fb27b86d"
  },
  {
    title: "Words To Me",
    artist: "Sugar Ray",
    duration: 241,
    preview: "adf4addf2b3bee5e255654f3d0218bed6b0471d9"
  },
  {
    title: "Walking Alone",
    artist: "Green Day",
    duration: 165,
    preview: "9b6cf9491e844247e560f31d5268be1fb603f2c2"
  },
  {
    title: "Someday",
    artist: "Sugar Ray",
    duration: 243,
    preview: "105cbc3264665f0448e517df6e2eac61182540a0"
  },
  {
    title: "Father Of Mine",
    artist: "Everclear",
    duration: 231,
    preview: "9b89f3a2647c69ec3d21797b59bac4cabb4885a9"
  },
  {
    title: "Breakfast At Tiffany's",
    artist: "Deep Blue Something",
    duration: 257,
    preview: "7bf57cbf18feec369fe7642170233df65c4c16f6"
  },
  {
    title: "The Freshmen",
    artist: "The Verve Pipe",
    duration: 269,
    preview: "a438eca96c7278118b29c72a2a9363eb592123aa"
  },
  {
    title: "Stand by Me",
    artist: "Oasis",
    duration: 356,
    preview: "29b62d8a9760e6305b155ce1f8cce616f066fe5a"
  },
  {
    title: "Have A Nice Day",
    artist: "Stereophonics",
    duration: 205,
    preview: "dc26f33ebf7e60f1be7516d7e62943897b3d26c4"
  }
]
