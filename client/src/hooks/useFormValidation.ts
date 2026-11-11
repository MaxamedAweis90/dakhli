import { useState, useCallback } from 'react'
import { ZodType, ZodError } from 'zod'

export interface UseFormValidationOptions {
  validateOnChange?: boolean
  validateOnBlur?: boolean
}

export function useFormValidation<T extends Record<string, any>>(
  schema: ZodType<any, any>,
  initialValues: T,
  options: UseFormValidationOptions = { validateOnChange: true, validateOnBlur: true }
) {
  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({})
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({})
  const [generalError, setGeneralError] = useState<string | null>(null)

  // Validate a single field using the schema
  const validateField = useCallback(
    (field: keyof T, newValues: T): string | undefined => {
      const result = schema.safeParse(newValues)
      if (result.success) {
        return undefined
      }

      const fieldIssue = (result.error as ZodError).issues.find(
        (issue) => issue.path.length > 0 && issue.path[0] === field
      )
      return fieldIssue?.message
    },
    [schema]
  )

  // Handle value change (real-time validation when touched or when error already exists)
  const handleChange = useCallback(
    (field: keyof T, value: any) => {
      setValues((prev) => {
        const next = { ...prev, [field]: value }

        // If field has been touched or already has an error, re-validate immediately in real-time
        if (options.validateOnChange && (touched[field] || errors[field])) {
          const fieldError = validateField(field, next)
          setErrors((prevErr) => ({
            ...prevErr,
            [field]: fieldError,
          }))
        }

        return next
      })

      // Clear general error when user modifies form
      if (generalError) {
        setGeneralError(null)
      }
    },
    [options.validateOnChange, touched, errors, validateField, generalError]
  )

  // Direct value setter without re-triggering full change handler
  const setFieldValue = useCallback((field: keyof T, value: any) => {
    setValues((prev) => ({ ...prev, [field]: value }))
  }, [])

  // Handle field blur
  const handleBlur = useCallback(
    (field: keyof T) => {
      setTouched((prev) => ({ ...prev, [field]: true }))

      if (options.validateOnBlur) {
        const fieldError = validateField(field, values)
        setErrors((prevErr) => ({
          ...prevErr,
          [field]: fieldError,
        }))
      }
    },
    [options.validateOnBlur, validateField, values]
  )

  // Full validation on form submit
  const validate = useCallback((): boolean => {
    const result = schema.safeParse(values)
    if (result.success) {
      setErrors({})
      return true
    }

    const newErrors: Partial<Record<keyof T, string>> = {}
    const newTouched: Partial<Record<keyof T, boolean>> = {}

    for (const issue of (result.error as ZodError).issues) {
      const field = issue.path[0] as keyof T
      if (field && !newErrors[field]) {
        newErrors[field] = issue.message
      }
      if (field) {
        newTouched[field] = true
      }
    }

    setErrors(newErrors)
    setTouched((prev) => ({ ...prev, ...newTouched }))

    // If there is an issue with no specific field path, set it as general error
    const rootIssue = (result.error as ZodError).issues.find((i) => i.path.length === 0)
    if (rootIssue) {
      setGeneralError(rootIssue.message)
    }

    return false
  }, [schema, values])

  // Attach server errors returned by API
  const setServerErrors = useCallback(
    (serverFieldErrors?: Record<string, string>, message?: string) => {
      if (serverFieldErrors && Object.keys(serverFieldErrors).length > 0) {
        setErrors((prev) => ({
          ...prev,
          ...(serverFieldErrors as Partial<Record<keyof T, string>>),
        }))
      }
      if (message) {
        setGeneralError(message)
      }
    },
    []
  )

  const clearErrors = useCallback(() => {
    setErrors({})
    setGeneralError(null)
  }, [])

  const reset = useCallback(
    (newValues?: T) => {
      setValues(newValues || initialValues)
      setErrors({})
      setTouched({})
      setGeneralError(null)
    },
    [initialValues]
  )

  return {
    values,
    errors,
    touched,
    generalError,
    handleChange,
    handleBlur,
    setFieldValue,
    validate,
    setServerErrors,
    setGeneralError,
    clearErrors,
    reset,
  }
}

export default useFormValidation

