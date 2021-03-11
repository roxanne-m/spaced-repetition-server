const xss = require('xss');
const clone = require('rfdc')();
const LanguageService = {
  getUsersLanguage(db, user_id) {
    return db
      .from('language')
      .select(
        'language.id',
        'language.name',
        'language.user_id',
        'language.head',
        'language.total_score'
      )
      .where('language.user_id', user_id)
      .first();
  },

  getLanguageWords(db, language_id) {
    return db
      .from('word')
      .select(
        'id',
        'language_id',
        'original',
        'translation',
        'next',
        'memory_value',
        'correct_count',
        'incorrect_count'
      )
      .where({ language_id })
      .map(clone);
  },

  async SetLanguageHead(db, language_id, language) {
    await db('language').where('id', '=', language_id).update(language);
  },

  async PopulateLinkedlist(db, language_id, ll) {
    const a = await db
      .from('word')
      .select(
        'id',
        'language_id',
        'original',
        'translation',
        'next',
        'memory_value',
        'correct_count',
        'incorrect_count'
      )
      .where({ language_id });
    //a.map is populating the LL

    let b = a.map(clone);
    b = b.sort((wordA, wordB) => wordA.memory_value - wordB.memory_value);
    b.forEach((word) => ll.insertLast(word));
    //return a is returning the array of words from db
    return b;
  },

  async insertNewLinkedList(db, ll) {
    for (let i = 0; i < ll.length; i++) {
      await db('word').where('id', '=', ll[i].id).update(ll[i]);
    }
    return;
  },

  async updateLanguagetotalScore(db, language) {
    await db('language')
      .where('user_id', '=', language.user_id)
      .update(language);
  },

  serializeLanguage(language) {
    return {
      id: language.id,
      name: xss(language.name),
      totalScore: language.total_score,
      userId: language.user_id,
      head: language.head,
    };
  },
};

module.exports = LanguageService;
