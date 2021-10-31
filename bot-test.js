// // import { io } from "socket.io-client";
// import fetch from 'node-fetch';
// import dotenv from 'dotenv';
// import websocket from 'websocket';
// const ENV = dotenv.config();

// const AUTH_BOT = ENV.parsed.BOT_AUTH;

// //let client = new websocket.client();

// const enode2Bin = (msg) => Uint8Array.from(msg.toString('hex'), (c) => c.charCodeAt(0));

// const msgEnter = {
//   $case: 'enter',
//   enter: {
//     info: {
//       name: 'YUP POAP BOT',
//       currentlyEquippedWearables: {
//         skin: 'BEyC1iiDaoaARIjdAI4e',
//         hair: 'jXBLf72xUhm9RBvnRxl5',
//         facial_hair: 'lwVKd5o2qwfH33bYz3y9',
//         top: '6ANbK54u3XykGt2pzbjk',
//         bottom: 'oLNpVNy0WKrLGyT5pzUJ',
//         shoes: 'i9nrRBJmG0TEXcNz5G4j',
//         hat: '9mtUlExO2IjTJhnjuweg',
//         glasses: '',
//         other: '99G0cshGbXFHBIl2C57a',
//         costume: '',
//       },
//     },
//   },
// };

// console.log(enode2Bin(msgEnter));

// try {
//   client.connect('wss://game-aaai-062.gather.town/', 'gather-v2');
// } catch (t) {
//   console.error('Failed to create websocket connection to gameserver: ');
// }

// (async (_) => {
//   const url = 'https://gather.town/api/registerUser?roomId=kjTwR9YguIVWMylX%5CYup';

//   const response = await fetch(url, {
//     method: 'GET',
//     cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
//     headers: {
//       'Content-Type': 'application/json',
//       authorization: AUTH_BOT,
//     },
//   });

//   if (response.ok) {
//     const json = await response.json();
//     console.log(json);
//   } else {
//     console.log(response);
//   }
// })();

// const socket = io("wss://game-aaai-065.gather.town",  {
// extraHeaders: {
//     "Sec-WebSocket-Key":  "dJKXtVI4Ec1gXERZLayCaQ==",
//     "Sec-WebSocket-Version": 13,
//     "Sec-WebSocket-Protocol": "gather-v2",
//     "Origin": "https://gather.town",
//     "Host": "game-aaai-065.gather.town",
//     "User-Agent": "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4684.1 Safari/537.36",
//   }
// }
// );

// socket.on("connect", () => {

//     console.log("Connected to server");

//     console.log(socket.id); // x8WIv7-mJelg7on_ALbx
//   });
