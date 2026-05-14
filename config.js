const LLAMA_E_LEARN_ITEMS = [
  { id: "1", label: "0ï", src: "assets/ba2714a80b50a1743801.mp3" },
  { id: "2", label: "3ï", src: "assets/2af8df89646861f77577.mp3" },
  { id: "3", label: "9ï", src: "assets/15e58e073b070016c64c.mp3" },
  { id: "4", label: "0i", src: "assets/4219a817c177195a402e.mp3" },
  { id: "5", label: "3i", src: "assets/5573e11b03c1777ef219.mp3" },
  { id: "6", label: "9i", src: "assets/78ec9be261cfedf19242.mp3" },
  { id: "7", label: "0î", src: "assets/12a88f7410bdd14f6826.mp3" },
  { id: "8", label: "3î", src: "assets/6546b8089d07b15ec9ae.mp3" },
  { id: "9", label: "0ë", src: "assets/7a8f8de338130436a83b.mp3" },
  { id: "10", label: "3ë", src: "assets/49055ef1771ee4784029.mp3" },
  { id: "11", label: "9ë", src: "assets/681d0ffb869a1e03efde.mp3" },
  { id: "12", label: "0e", src: "assets/524dc7b4f91f1d3637f3.mp3" },
  { id: "13", label: "3e", src: "assets/a5d52896f4c57b9d33ed.mp3" },
  { id: "14", label: "9e", src: "assets/db841c023ec15052c389.mp3" },
  { id: "15", label: "0ê", src: "assets/7b7f59d92ee3cae510dd.mp3" },
  { id: "16", label: "3ê", src: "assets/b4b4f7ba6b86dac6402b.mp3" },
  { id: "17", label: "0ü", src: "assets/566f3479fafc2819687a.mp3" },
  { id: "18", label: "3ü", src: "assets/1769408d471b267127c1.mp3" },
  { id: "19", label: "9ü", src: "assets/ca28d86a238c5a5e734d.mp3" },
  { id: "20", label: "0u", src: "assets/6f97c3896379c04463eb.mp3" },
  { id: "21", label: "3u", src: "assets/c9d4038c2a3de82533ef.mp3" },
  { id: "22", label: "9u", src: "assets/36b24a8d326ef6aa8c19.mp3" },
  { id: "23", label: "0û", src: "assets/4f3953998af51df49843.mp3" },
  { id: "24", label: "3û", src: "assets/1675ce9bf55168810437.mp3" }
];

const LLAMA_E_CHOICES = [
  { id: "dudi", label: "3u3i", word: "dudi" },
  { id: "dupi", label: "3u0ï", word: "dupi" },
  { id: "nudi", label: "3û3i", word: "nudi" },
  { id: "mudi", label: "0û3i", word: "mudi" },
  { id: "gita", label: "9i3ë", word: "gita" },
  { id: "kuta", label: "9ü3ë", word: "kuta" },
  { id: "kupa", label: "9ü0ë", word: "kupa" },
  { id: "kama", label: "9ë0ê", word: "kama" },
  { id: "tata", label: "3ë3ë", word: "tata" },
  { id: "tina", label: "3ï3ê", word: "tina" },
  { id: "pata", label: "0ë3ë", word: "pata" },
  { id: "pima", label: "0ï0ê", word: "pima" },
  { id: "bita", label: "0i3ë", word: "bita" },
  { id: "????", label: "?", word: "????" },
  { id: "dinu", label: "3i3û", word: "dinu" },
  { id: "tadu", label: "3ë3u", word: "tadu" },
  { id: "kadu", label: "9ë3u", word: "kadu" },
  { id: "maku", label: "0ê9ü", word: "maku" },
  { id: "panu", label: "0ë3û", word: "panu" },
  { id: "binu", label: "0i3û", word: "binu" },
  { id: "bubu", label: "0u0u", word: "bubu" }
];

const LLAMA_E_TEST_AUDIO = [
  "assets/c67d4429a516e960a953.mp3",
  "assets/a4eb6b3c64c8417e31c9.mp3",
  "assets/7bc314fabf55bdcd14fe.mp3",
  "assets/840b1ef6a6720aca9349.mp3",
  "assets/954adc686ea8d1875fc3.mp3",
  "assets/73faf82633e9b8c5187f.mp3",
  "assets/0300785eb67d81ae5cff.mp3",
  "assets/f9468ee155aba3ecd957.mp3",
  "assets/685c9e91c4a0b5fc3b0d.mp3",
  "assets/b00c7b5573f985f9b200.mp3",
  "assets/1af23e38627e38720a0b.mp3",
  "assets/6ef784f814af2709b6b0.mp3",
  "assets/88d0be70188adb49f4cb.mp3",
  "assets/bcc53e5b2843b7a70ef8.mp3",
  "assets/54cfa6bfc85c2fa71a73.mp3",
  "assets/152ca9d4d6aaf07466f3.mp3",
  "assets/b4af096d62edf357e2d8.mp3",
  "assets/d10221c0c964eedd007c.mp3",
  "assets/6a6e38f8bab4e19e5642.mp3",
  "assets/e7372f5cfe8d3499f714.mp3"
];

const LLAMA_E_KEY = [
  "dinu", "panu", "bubu", "kadu", "maku",
  "tadu", "binu", "mudi", "dupi", "nudi",
  "dudi", "kama", "tina", "kuta", "tata",
  "pima", "pata", "gita", "bita", "kupa"
];

window.LLAMA_LOCAL_CONFIG = {
  testCode: "LLAMA_E",
  displayTitle: "LLAMA E",
  version: "4.0.6",
  officialUrl: "https://www.llamatests.org/tests/LLAMA_E.html",
  assetBase: "https://www.llamatests.org/",
  soundcheck: {
    src: "assets/4ded55c5eb881b445a42.mp3"
  },
  i18n: {
    ja: {
      intro: [
        "LLAMA E は、聞き慣れた音と見慣れない文字を結びつける力を調べるテストです。",
        "このテストでは音声を使います。スピーカーまたはヘッドホンの音量を確認してください。",
        "音量確認のあと、新しい文字体系を 2 分間学習します。",
        "開始 60 秒後に「テスト開始」ボタンが有効になります。テストでは聞こえた語に対応する表記を選びます。"
      ],
      learn_heading: "新しい文字体系を学習してください",
      learn_instruction: "各ボタンを押すと対応する音が再生されます。",
      result_description: "LLAMA_E は、聞き慣れた音と見慣れない文字を結びつける力を調べるテストです。",
      footer: "参照元: LLAMA E 4.0.6 2025-02-25, Swansea University。ローカル実験用の再実装です。"
    },
    en: {
      intro: [
        "LLAMA E tests how good you are at linking familiar sounds with unfamiliar letters.",
        "This test uses sound, so make sure your speaker or headphones are turned up.",
        "After the sound check, you have two minutes to study a new alphabet.",
        "You may start the test early after 60 seconds. In the test, select the spelling that matches the word you hear."
      ],
      learn_heading: "Study the new alphabet",
      learn_instruction: "Click each button to hear the corresponding sound.",
      result_description: "LLAMA_E tests how good you are at linking familiar sounds with unfamiliar letters.",
      footer: "Source model: LLAMA E 4.0.6 2025-02-25, Swansea University. Local implementation for offline-style data collection."
    }
  },
  learn: {
    mode: "audioButtons",
    durationMs: 120000,
    unlockMs: 60000,
    items: LLAMA_E_LEARN_ITEMS
  },
  test: {
    mode: "wordChoiceAudio",
    choiceType: "text",
    choiceColumns: 7,
    choices: LLAMA_E_CHOICES,
    items: LLAMA_E_TEST_AUDIO.map((src, index) => ({
      id: `Q${String(index + 1).padStart(2, "0")}`,
      prompt: `Word ${String(index + 1).padStart(2, "0")}`,
      src,
      correct: LLAMA_E_KEY[index],
      correctText: LLAMA_E_KEY[index],
      maxScore: 1
    }))
  }
};
