const WebSocket = require("ws");
const wss = new WebSocket.Server({ port: 8080 });
const { ytSimpleSolver, getCommands, getIgFile } = require("./functions");

wss.on("connection", (ws) => {
	ws.on("message", async (message) => {
		const msg = JSON.parse(message.toString());
		if (msg.text === "play") {
			const urls = [
				"https://youtu.be/0v-I8ETYNbU",
				"https://youtu.be/mOOFJOyyufA",
				"https://youtu.be/SgdZ8YAQNo8",
				"https://youtu.be/AwTY2Tj4gz8",
				"https://youtu.be/YZxnZn3IjGY",
				"https://youtu.be/dRWCxYMh-D8",
				"https://youtu.be/umu98yc8HXA",
				"https://youtu.be/gXDNEJyQzOY",
				"https://youtu.be/HwaSbWS9G_Y",
				"https://youtu.be/9_1OWAwsUj0",
				"https://youtu.be/kJO3clS_aGY",
				"https://youtu.be/uyShmpDRwe4",
				"https://youtu.be/PrcruiqL8DI",
				"https://youtu.be/dEMrYAKmXsQ",
				"https://youtu.be/5aIOnDXEbc0",
				"https://youtu.be/nxkfVakeFag",
			];
			await ytSimpleSolver(
				urls[Math.floor(Math.random() * urls.length)],
			).then((res) => {
				console.log(res);
				ws.send(JSON.stringify(res));
			});
		} else if (msg.text === "help") {
			await getCommands().then((res) => {
				console.log(res.command);
				ws.send(JSON.stringify(res.command));
			});
		} else if ("igdl") {
			const urls = [
				"https://www.instagram.com/p/C79VPMyg7qd/",
				"https://www.instagram.com/reel/C5dz_ShucN7/",
				"https://www.instagram.com/reel/C70hD0cuXlP/",
				"https://www.instagram.com/reel/C5_fY_XocWI/",
				"https://www.instagram.com/reel/C7UyeGrSrF9/",
				"https://www.instagram.com/reel/C7Y8zmUv9i6/",
				"https://www.instagram.com/reel/C7inqe1OtXh/",
				"https://www.instagram.com/reel/C7K1hgJOpYD/",
				"https://www.instagram.com/reel/C6jNb5vuyko/",
			];
			await getIgFile(urls[Math.floor(Math.random() * urls.length)]).then(
				(res) => {
					console.log(res);
					ws.send(JSON.stringify(res));
				},
			);
		}
	});
});

console.log("WebSocket server is running on ws://localhost:8080");
