import { effect, signal } from './signal.js';

// terminal utils
const stdout = typeof process === 'object';
const bold = stdout ? value => `\x1b[1m${value}\x1b[0m` : String;
const dim = stdout ? value => `\x1b[2m${value}\x1b[0m` : String;
const log = stdout ?
  str => process.stdout.write(str) :
  str => { if (!str.startsWith('\x1b')) console.log(str); };

// game utils
const player = name => ({
  name,
  score: signal(0)
});

// a random scoring game
const bestOf10 = (...names) => {
  let timer, round = 0;
  const players = names.map(player);

  // score randomly and cleanup the previous output
  const randomScore = () => {
    // this triggers the effect by updating a score
    const index = Math.random() * players.length;
    players[index >>> 0].score.value++;
  };

  // the effect automatically updated
  const stop = effect(() => {
    const cleanUp = !!round;
    const output = [];
    output.push(dim(`Round: ${round}`));
    for (const { name, score } of players)
      output.push(`  Player ${name}: ${score}`);

    if (round++ < 10) {
      // cleanup in case players scores were changed
      clearTimeout(timer);
      timer = setTimeout(randomScore, 1000);
      output.push('');
    }
    else {
      players.sort(({ score: a }, { score: z }) => z - a);
      const { name, score: { value } } = players.shift();
      if (players.some(({ score }) => score == value))
        output.push(`IT'S A TIE\n`);
      else
        output.push(`THE WINNER IS ${bold(name)}\n`);
    }

    if (cleanUp) {
      log('\x1b[A\x1b[K'.repeat(output.length - 1));
      log('\x1b7');
    }

    log(output.join('\n'));
  });

  // return a way to stop the game
  return [
    players,
    () => {
      clearTimeout(timer);
      stop();
    }
  ];
};

const [ players, end ] = bestOf10("Andrew", "Jane", "William");
// end() to exit the game

// give Jane some advantage
// setTimeout(() => { players[1].score.value++ }, 2500);
