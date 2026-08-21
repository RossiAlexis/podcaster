type FilterInputProps = {
  searchValue: string;
  onFilterChange: (value: string) => void;
};
export default function FilterInput({
  searchValue,
  onFilterChange,
}: FilterInputProps) {
  return (
    <label className="block w-full sm:max-w-sm">
      <span className="sr-only">Filter podcasts</span>
      <input
        aria-label="Filter podcasts"
        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        onChange={(event) => onFilterChange(event.target.value)}
        placeholder="Filter podcasts..."
        type="search"
        value={searchValue}
      />
    </label>
  );
}
