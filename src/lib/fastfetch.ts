const BASE_URL =
	"https://raw.githubusercontent.com/fastfetch-cli/fastfetch/refs/heads/dev/src/logo/ascii/";

const cache = new Map<string, Promise<string>>();

export async function fetchLogo(distro: string): Promise<string> {
	const cached = cache.get(distro);
	if (cached) return cached;

	const promise = (async () => {
		const logo = await fetch(`${BASE_URL}/${distro.at(0)}/${distro}.txt`);
		return await logo.text();
	})();

	cache.set(distro, promise);
	return promise;
}
