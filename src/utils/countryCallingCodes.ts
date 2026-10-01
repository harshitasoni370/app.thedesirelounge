import { getCountries, getCountryCallingCode, type CountryCode } from "libphonenumber-js/max";

export interface CountryCallingCodeOption {
	country: CountryCode;
	name: string;
	callingCode: string;
	flag: string;
}

const countryNames = new Intl.DisplayNames(["en"], { type: "region" });

function getFlag(country: CountryCode): string {
	return Array.from(country, (letter) => String.fromCodePoint(127397 + letter.charCodeAt(0))).join("");
}

export const COUNTRY_CALLING_CODES: CountryCallingCodeOption[] = getCountries()
	.map((country) => ({
		country,
		name: countryNames.of(country) || country,
		callingCode: getCountryCallingCode(country),
		flag: getFlag(country),
	}))
	.sort((left, right) => left.name.localeCompare(right.name));

export function getCountryForCallingCode(callingCode: string, currentCountry?: CountryCode): CountryCode {
	const normalizedCallingCode = callingCode.replace(/\D/g, "");
	if (currentCountry && getCountryCallingCode(currentCountry) === normalizedCallingCode) return currentCountry;

	if (normalizedCallingCode === "1") return "US";
	if (normalizedCallingCode === "7") return "RU";
	if (normalizedCallingCode === "44") return "GB";

	return COUNTRY_CALLING_CODES.find((option) => option.callingCode === normalizedCallingCode)?.country || "US";
}
