// generate random string of specified length
export default function randomString(length: number): string {
	let result = "";
	const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
	const charactersLength = characters.length;

	for (let index = 0; index < length; index++) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}

	return result;
}
