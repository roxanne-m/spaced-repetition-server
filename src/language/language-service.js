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

  // gets next word to learn
  getNextWord(db, id) {
    return db
      .from('word')
      .select('id', 'next', 'original', 'correct_count', 'incorrect_count')
      .where({ id })
      .first();
  },

  // get word by its id
  getWordById(db, id) {
    return db.from('word').select('*').where({ id }).first();
  },

  //update word and info (correct and incorrect count)
  updateWordInfo(db, currentNode, nextNode) {
    return db
      .from('word')
      .where({
        id: currentNode.id,
        language_id: currentNode.language_id,
      })
      .update({
        memory_value: currentNode.memory_value,
        correct_count: currentNode.correct_count,
        incorrect_count: currentNode.incorrect_count,
        next: nextNode !== null ? nextNode.id : null,
      });
  },

  // update head
  updateHead(db, id, user_id, head) {
    return db.from('language').where(id, user_id).update({ head });
  },

  // updates total score
  updateTotalScore(db, id, user_id, total_score) {
    return db.from('language').where({ id, user_id }).update({ total_score });
  },
};

module.exports = LanguageService;
