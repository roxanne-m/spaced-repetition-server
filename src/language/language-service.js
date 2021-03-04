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
      .where({ language_id });
  },

  // get word by its id
  getWordById(db, id) {
    return db.from('word').select('*').where({ id }).first();
  },

  // update head
  updateHead(db, head) {
    return db.from('language').where({ id: head.id }).update(head);
  },

  // updates total score
  updateTotalScore(db, id, user_id, total_score) {
    return db.from('language').where({ id, user_id }).update({ total_score });
  },

  // populate the linked list with information required
  async populateLinkedList(db, language_id, linkedList, head) {
    let list = await db
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
    let word = list.find((w) => w.id === head);
    while (word) {
      linkedList.insertLast(word);
      word = list.find((w) => w.id === word.next);
    }

    // return list returns the array of words from database
    return list;
  },

  // updates the new linked list. Compares the id to the linkedlist id and performs the updates.
  async insertNewLinkedList(db, linkedList) {
    for (let i = 0; i < linkedList.length; i++) {
      await db('word').where('id', '=', linkedList[i].id).update(linkedList[i]);
    }
    return;
  },

  // update the language total score
  async updateLanguageTotalScore(db, language) {
    await db('language')
      .where('user_id', '=', language.user_id)
      .update(language);
  },
};

module.exports = LanguageService;
