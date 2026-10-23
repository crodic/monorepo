import {
  forwardRef,
  useCallback,
  useMemo,
  useState,
  type ComponentPropsWithoutRef,
} from 'react'
import { useFormContext } from 'react-hook-form'
import type { MultiValue, OnChangeValue, SingleValue } from 'react-select'
import {
  AutoCompleteAsyncSelect,
  type OptionType,
  type OptionValue,
} from '@/components/auto-complete-async-select'

export interface AutoCompleteAsyncSelectControlProps<
  TOption extends OptionType = OptionType,
> extends Omit<
  ComponentPropsWithoutRef<typeof AutoCompleteAsyncSelect<TOption>>,
  'value' | 'onChange'
> {
  name?: string
  /**
   * Form-managed value: primitive ID, array of IDs, or full OptionType object.
   */
  value?: OptionValue | OptionValue[] | TOption | TOption[] | null
  /**
   * Callback fired when value changes, passing primitive ID or array of IDs.
   */
  onChange?: (value: OptionValue | OptionValue[] | undefined) => void
  /**
   * Callback fired when option is selected, providing the full option object.
   */
  onSelectOption?: (option: TOption | TOption[] | null) => void
  /**
   * Initial option for edit mode when options list is not yet loaded.
   * Example: defaultOption={city?.country ? { value: city.country.id, label: city.country.name } : undefined}
   */
  defaultOption?: TOption | TOption[] | null
}

function resolveSelectedOption(
  candidate: OptionType | OptionType[] | null | undefined,
  value: unknown,
  isMulti?: boolean
): OptionType | OptionType[] | null {
  if (!candidate) return null

  if (isMulti && Array.isArray(candidate) && Array.isArray(value)) {
    const matches = candidate.filter((opt) =>
      value.some((v) => String(v) === String(opt.value ?? (opt as any).id))
    )
    return matches.length > 0 ? matches : null
  }

  if (!isMulti && !Array.isArray(candidate)) {
    const optVal = candidate.value ?? (candidate as any).id
    if (String(optVal) === String(value)) {
      return candidate
    }
  }

  return null
}

export const AutoCompleteAsyncSelectControl = forwardRef<
  any,
  AutoCompleteAsyncSelectControlProps
>(
  (
    { onChange, onSelectOption, value, name, defaultOption, isMulti, ...props },
    ref
  ) => {
    const form = useFormContext()

    // Track the user-selected option object to retain label display
    const [currentSelectedOption, setCurrentSelectedOption] = useState<
      OptionType | OptionType[] | null
    >(null)

    const selectedOption = useMemo(() => {
      if (value == null || value === '') return null

      // Value is already an option object
      if (typeof value === 'object' && !Array.isArray(value)) {
        return value as any
      }
      if (
        Array.isArray(value) &&
        value.length > 0 &&
        typeof value[0] === 'object'
      ) {
        return value as any
      }

      const matchedCurrent = resolveSelectedOption(
        currentSelectedOption,
        value,
        isMulti
      )
      if (matchedCurrent) return matchedCurrent

      const matchedDefault = resolveSelectedOption(
        defaultOption,
        value,
        isMulti
      )
      if (matchedDefault) return matchedDefault

      // Fallback: render placeholder label with the primitive value
      return isMulti
        ? (Array.isArray(value) ? value : [value]).map((v) => ({
            value: v as OptionValue,
            label: String(v),
          }))
        : {
            value: value as OptionValue,
            label: String(value),
          }
    }, [value, currentSelectedOption, defaultOption, isMulti])

    const handleOnChange = useCallback(
      (v: OnChangeValue<OptionType, boolean>) => {
        setCurrentSelectedOption(v as any)
        onSelectOption?.(v as any)

        if (v == null && name != null && form) {
          onChange?.(undefined)
          form.resetField(name, { defaultValue: null })
          return
        }

        if (Array.isArray(v)) {
          const ids = (v as MultiValue<OptionType>).map(
            (i) => i.value ?? (i as any).id
          )
          onChange?.(ids)
        } else {
          const single = v as SingleValue<OptionType>
          const id = single?.value ?? (single as any)?.id ?? undefined
          onChange?.(id)
        }
      },
      [form, name, onChange, onSelectOption]
    )

    return (
      <AutoCompleteAsyncSelect
        selectRef={ref}
        isMulti={isMulti as any}
        value={selectedOption as any}
        onChange={handleOnChange as any}
        {...props}
      />
    )
  }
)

AutoCompleteAsyncSelectControl.displayName = 'AutoCompleteAsyncSelectControl'

export default AutoCompleteAsyncSelectControl
