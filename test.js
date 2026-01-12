const NexveilAuth = require('nexveil-auth');

async function main() {
  const auth = new NexveilAuth({
    appName: 'solara',
    secret1: "4444454636363636363737373734734745645642461346434366345364536453",
    secret2: "56865856865658653865386538636386364364t3463643463643463wr32wa42a",
    secret3: "745836473526478u2746574527542452w365yaw36rqwa3tr5wa6yr36ayha456t",
    apiUrl: 'http://api.nexveil.local:4000' // dev api, remove that config for prod.
  });

  const result = await auth.verify('LICENSE-KEY');
  if (result.success) {
    console.log('✅ Licensed!');
  }
  console.log(result)
}

main();
