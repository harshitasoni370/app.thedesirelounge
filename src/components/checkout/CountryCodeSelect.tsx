import type { CountryCode } from "libphonenumber-js/max";
import Select, { type StylesConfig } from "react-select";
import { COUNTRY_CALLING_CODES } from "@/utils/countryCallingCodes";
import type { CountryCallingCodeOption } from "@/utils/countryCallingCodes";

interface Props {
  country: CountryCode;
  onChange: (country: CountryCode) => void;
}

const selectStyles: StylesConfig<CountryCallingCodeOption, false> = {
  container: (base) => ({ ...base, flex: "0 0 110px", width: 110 }),
  control: (base) => ({
    ...base,
    backgroundColor: "transparent",
    border: 0,
    borderRight: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: 0,
    boxShadow: "none",
    cursor: "pointer",
    minHeight: "100%",
    "&:hover": { borderColor: "transparent" },
  }),
  valueContainer: (base) => ({ ...base, minWidth: 0, padding: "0 6px" }),
  singleValue: (base) => ({
    ...base,
    color: "rgba(255, 255, 255, 0.88)",
    fontSize: "0.82rem",
    margin: 0,
    maxWidth: "100%",
    whiteSpace: "nowrap",
  }),
  input: (base) => ({ ...base, color: "white", margin: 0, padding: 0 }),
  indicatorsContainer: (base) => ({ ...base, width: 20 }),
  dropdownIndicator: (base) => ({ ...base, color: "rgba(255, 255, 255, 0.65)", padding: "0 4px" }),
  indicatorSeparator: () => ({ display: "none" }),
  menu: (base) => ({ ...base, color: "#202020", minWidth: 260, zIndex: 20 }),
  menuList: (base) => ({ ...base, maxHeight: 260 }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected ? "#d96614" : state.isFocused ? "#f4e3d5" : "white",
    color: state.isSelected ? "white" : "#202020",
    cursor: "pointer",
    fontSize: "0.9rem",
  }),
};

export function CountryCodeSelect({ country, onChange }: Props) {
  const selectedOption = COUNTRY_CALLING_CODES.find((option) => option.country === country) || null;

  return (
    <Select<CountryCallingCodeOption, false>
      aria-label="Country calling code"
      className="country-code-select"
      classNamePrefix="country-code-select"
      options={COUNTRY_CALLING_CODES}
      value={selectedOption}
      onChange={(option) => {
        if (option) onChange(option.country);
      }}
      getOptionValue={(option) => option.country}
      getOptionLabel={(option) => `${option.name} +${option.callingCode}`}
      formatOptionLabel={(option, { context }) =>
        context === "menu" ? `${option.flag} ${option.name} (+${option.callingCode})` : `${option.flag} +${option.callingCode}`
      }
      isSearchable
      styles={selectStyles}
    />
  );
}