const express = require('express');
const LanguageService = require('./language-service');
const { requireAuth } = require('../middleware/jwt-auth');
const LinkedList = require('./singly-linked-list');

const languageRouter = express.Router();
const jsonBodyParser = express.json();

languageRouter.use(requireAuth).use(async (req, res, next) => {
  try {
    const language = await LanguageService.getUsersLanguage(
      req.app.get('db'),
      req.user.id
    );

    if (!language)
      return res.status(404).json({
        error: `You don't have any languages`,
      });

    req.language = language;
    next();
  } catch (error) {
    next(error);
  }
});

// This endpoint is /api/language/
// This .get route uses an async function with await (an operator that waits for a Promise)
// for the service function getLanguageWords (that takes in the db (req.app.get('db')) and language id (req.language.id))
// This will return the Promise and be able to access the Language and the words from word table in database
languageRouter.get('/', async (req, res, next) => {
  try {
    const words = await LanguageService.getLanguageWords(
      req.app.get('db'),
      req.language.id
    );

    res.json({
      language: req.language,
      words,
    });
    next();
  } catch (error) {
    next(error);
  }
});

languageRouter.get('/head', async (req, res, next) => {
  try {
    let nextWord = await LanguageService.getNextWord(
      req.app.get('db'),
      req.language.head
    );
    res.json({
      nextWord: nextWord.original,
      wordCorrectCount: nextWord.correct_count,
      wordIncorrectCount: nextWord.incorrect_count,
      totalScore: req.language.total_score,
    });
    next();
  } catch (error) {
    next(error);
  }
});

languageRouter.post('/guess', jsonBodyParser, async (req, res, next) => {
  spacedRepetitionDb = req.app.get('db');

  try {
    // destructure object
    const { guess } = req.body;

    if (!req.body.guess) {
      return res.status(400).json({
        error: `Missing 'guess' in request body`,
      });
    }

    // create new linked list
    const list = new LinkedList();
    // get head, insert into Linked list (pass in db and language head)
    let headNode = await LanguageService.getWordById(
      spacedRepetitionDb,
      req.language.head
    );

    list.insertFirst(headNode);

    // get the rest of the words, insert into Linked list
    // while condition to check if more words exist in db

    while (headNode.next !== null) {
      let nextNode = await LanguageService.getWordById(
        spacedRepetitionDb,
        headNode.next
      );
      list.insertLast(nextNode);
      headNode = nextNode;
    }

    // check the user's guess if correct or incorrect
    let correct = false;

    if (guess.toLowerCase() === list.head.value.translation) {
      // set correct to true
      correct = true;
      // add one to the correct count
      console.log(list.head.value.correct_count, 'CORRECT COUNT BEFORE');
      ++list.head.value.correct_count;
      console.log(list.head.value.correct_count, 'CORRECT COUNT AFTER');
      // Double the value of M (memory values)
      list.head.value.memory_value *= 2;

      // increase total score
      ++req.language.total_score;
    } else {
      // increase incorrect count
      ++list.head.value.incorrect_count;

      // reset M (memory value to 1)
      list.head.value.memory_value = 1;
    }

    // move previous word to its new position
    const oldHead = list.head;
    list.remove(list.head.value);
    list.insertAt(oldHead.value.memory_value, oldHead.value);

    let currNode = list.head;
    let langHead = currNode.value.id;

    while (currNode !== null) {
      await LanguageService.updateWordInfo(
        spacedRepetitionDb,
        currNode.value,
        currNode.next !== null ? currNode.next.value : null
      );

      currNode = currNode.next;
    }

    // update head
    await LanguageService.updateHead(
      spacedRepetitionDb,
      req.language.id,
      req.language.user_id,
      langHead
    );

    // update total score
    await LanguageService.updateTotalScore(
      spacedRepetitionDb,
      req.language.id,
      req.language.user_id,
      req.language.total_score
    );

    // create response variable
    const response = {
      nextWord: list.head.value.original,
      totalScore: req.language.total_score,
      wordCorrectCount: list.head.value.correct_count,
      wordIncorrectCount: list.head.value.incorrect_count,
      answer: oldHead.value.translation,
      isCorrect: correct,
    };

    return res.status(200).json(response);
  } catch (error) {
    next(error);
  }
});

module.exports = languageRouter;
