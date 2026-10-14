"use client";

import { useId, useState } from "react";
import { Check, Search } from "lucide-react";

import { input } from "./styles";

export type ComboboxEmployee = {
  employee_code: string;
  full_name: string;
  department: string | null;
};

const MAX_RESULTS = 8;

function normalize(value: string) {
  return value.toLocaleLowerCase("tr").trim();
}

/** Ad veya sicil numarasıyla aranabilen çalışan seçici; seçimi gizli bir alanla gönderir. */
export function EmployeeCombobox({
  id,
  name,
  employees,
  invalid,
  describedBy,
}: {
  id: string;
  name: string;
  employees: ComboboxEmployee[];
  invalid?: boolean;
  describedBy?: string;
}) {
  const listId = useId();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<ComboboxEmployee | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const needle = normalize(query);
  const results = employees
    .filter(
      (employee) =>
        !needle ||
        normalize(employee.full_name).includes(needle) ||
        normalize(employee.employee_code).includes(needle),
    )
    .slice(0, MAX_RESULTS);

  const choose = (employee: ComboboxEmployee) => {
    setSelected(employee);
    setQuery(`${employee.full_name} (${employee.employee_code})`);
    setIsOpen(false);
  };

  return (
    <div>
      <input type="hidden" name={name} value={selected?.employee_code ?? ""} />
      <div className="relative">
        <Search
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-faint"
        />
        <input
          id={id}
          type="text"
          role="combobox"
          autoComplete="off"
          aria-expanded={isOpen}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={isOpen && results[activeIndex] ? `${listId}-${activeIndex}` : undefined}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          placeholder="Ad veya sicil no yazın"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setSelected(null);
            setIsOpen(true);
            setActiveIndex(0);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setIsOpen(false)}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setIsOpen(true);
              setActiveIndex((index) => Math.min(index + 1, results.length - 1));
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActiveIndex((index) => Math.max(index - 1, 0));
            } else if (event.key === "Enter" && isOpen && results[activeIndex]) {
              event.preventDefault();
              choose(results[activeIndex]);
            } else if (event.key === "Escape" && isOpen) {
              // Pencereyi değil yalnızca listeyi kapat.
              event.preventDefault();
              event.stopPropagation();
              setIsOpen(false);
            }
          }}
          className={`${input} pl-9`}
        />
      </div>

      {isOpen && (
        <ul
          id={listId}
          role="listbox"
          className="mt-1.5 max-h-56 overflow-y-auto rounded-lg border border-line bg-surface p-1 shadow-card"
        >
          {results.length === 0 ? (
            <li className="px-3 py-2 text-sm text-ink-faint">Eşleşen çalışan yok</li>
          ) : (
            results.map((employee, index) => (
              <li
                key={employee.employee_code}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={selected?.employee_code === employee.employee_code}
                // Seçim blur'dan önce gerçekleşsin.
                onMouseDown={(event) => {
                  event.preventDefault();
                  choose(employee);
                }}
                onMouseEnter={() => setActiveIndex(index)}
                className={`flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm ${
                  index === activeIndex ? "bg-sunken" : ""
                }`}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-ink">{employee.full_name}</span>
                  <span className="block truncate text-xs text-ink-faint">
                    <span className="font-mono">{employee.employee_code}</span>
                    {employee.department ? `, ${employee.department}` : ""}
                  </span>
                </span>
                {selected?.employee_code === employee.employee_code && (
                  <Check aria-hidden className="size-4 shrink-0 text-accent" />
                )}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
