// =====================
// DOM
// =====================

const dailyWordContainer =
  document.getElementById(
    "dailyWordContainer"
  );

const classicCopybooksContainer =
  document.getElementById(
    "classicCopybooksContainer"
  );

const calligraphersContainer =
  document.getElementById(
    "calligraphersContainer"
  );

const knowledgeContainer =
  document.getElementById(
    "knowledgeContainer"
  );

// =====================
// 工具
// =====================

async function loadJson(url) {

  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(url);
  }

  return await res.json();

}

// =====================
// 每日一字
// =====================

async function loadDailyWord() {

  try {

    const words =
      await loadJson(
        "./data/dailyWords.json"
      );

    const day =
      new Date().getDate();

    const word =
      words[
        day % words.length
      ];

    dailyWordContainer.innerHTML =
      `
      <div class="daily-word-card">

        <div class="daily-word-char">
          ${word.word}
        </div>

        <div class="daily-word-info">

          <h4>
            ${word.pinyin}
          </h4>

          <p>
            ${word.meaning}
          </p>

        </div>

      </div>
      `;

  } catch (e) {

    console.error(e);

  }

}

// =====================
// 经典碑帖
// =====================

async function loadCopybooks() {

  try {

    const list =
      await loadJson(
        "./data/copybooks.json"
      );

    classicCopybooksContainer.innerHTML =
      list.map(item => `
      <div
        class="copybook-card"
        onclick="location.href='./discovery/copybook.html?id=${item.id}'"
      >

        <img
          src="${item.cover}"
          alt="${item.name}"
        >

        <div class="copybook-info">

          <h4>
            ${item.name}
          </h4>

          <p>
            ${item.author}
          </p>

        </div>

      </div>
      `).join("");

  } catch (e) {

    console.error(e);

  }

}

// =====================
// 书法名家
// =====================

async function loadCalligraphers() {

  try {

    const list =
      await loadJson(
        "./data/calligraphers.json"
      );


    calligraphersContainer.innerHTML =
      list.map(item => `
      <div
        class="calligrapher-card"
        onclick="location.href='./discovery/calligrapher.html?id=${item.id}'"
      >

        <img
          src="${item.avatar}"
          alt="${item.name}"
        >

        <div class="calligrapher-info">

          <h4>
            ${item.name}
          </h4>

          <span>
            ${item.dynasty}
          </span>

          <p>
            ${item.description}
          </p>

        </div>

      </div>
      `).join("");

  } catch (e) {

    console.error(e);

  }

}

// =====================
// 今日知识
// =====================

async function loadKnowledge() {

  try {

    const list =
      await loadJson(
        "./data/knowledge.json"
      );

    const day =
      new Date().getDate();

    const item =
      list[
        day % list.length
      ];

    knowledgeContainer.innerHTML =
      `
      <div class="knowledge-card">

        <h4>
          ${item.title}
        </h4>

        <p>
          ${item.content}
        </p>

      </div>
      `;

  } catch (e) {

    console.error(e);

  }

}

// =====================
// 初始化
// =====================

loadDailyWord();
loadCopybooks();
loadCalligraphers();
loadKnowledge();