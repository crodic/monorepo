import { useCallback, useMemo } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { SearchIcon, ShieldCheckIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { FormItem } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import type { PermissionSchema } from '@/pages/permissions/schema'
import {
  formatSubjectLabel,
  getPermissionAction,
} from '../permission-matrix.helper'
import type { RoleFormSchema } from '../schema'
import { usePermissionMatrix } from '../use-permission-matrix'

interface RolePermissionsFieldProps {
  form: UseFormReturn<RoleFormSchema>
  permissions: PermissionSchema[]
  disabled?: boolean
  isLoading?: boolean
  isError?: boolean
}

export function RolePermissionsField({
  form,
  permissions,
  disabled = false,
  isLoading = false,
  isError = false,
}: RolePermissionsFieldProps) {
  const { t } = useTranslation()
  const watchedPermissionIds = form.watch('permissionIds')
  const selectedPermissionIds = useMemo(
    () => watchedPermissionIds ?? [],
    [watchedPermissionIds]
  )

  const handlePermissionIdsChange = useCallback(
    (permissionIds: string[]) => {
      form.setValue('permissionIds', permissionIds, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      })
    },
    [form]
  )

  const {
    searchValue,
    setSearchValue,
    assignablePermissions,
    groupedPermissions,
    selectedCount,
    availableCount,
    isGroupChecked,
    isGroupIndeterminate,
    isPermissionChecked,
    toggleGroup,
    togglePermission,
  } = usePermissionMatrix({
    permissions,
    selectedPermissionIds,
    onPermissionIdsChange: handlePermissionIdsChange,
    isLoading,
    isError,
  })

  const getGroupCheckedState = (group: string): boolean | 'indeterminate' => {
    if (isGroupChecked(group)) return true
    if (isGroupIndeterminate(group)) return 'indeterminate'
    return false
  }

  const renderPermissionsContent = () => {
    if (isLoading) {
      return (
        <div className='text-muted-foreground rounded-md border p-4 text-sm'>
          Loading permissions...
        </div>
      )
    }

    if (isError) {
      return (
        <div className='text-destructive rounded-md border p-4 text-sm'>
          Failed to load permissions
        </div>
      )
    }

    const searchInput = (
      <div className='relative'>
        <SearchIcon className='text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2' />
        <Input
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
          placeholder='Search permissions'
          className='ps-9'
          disabled={disabled}
        />
      </div>
    )

    if (assignablePermissions.length === 0) {
      return (
        <>
          {searchInput}
          <div className='text-muted-foreground rounded-md border p-4 text-sm'>
            No permissions available
          </div>
        </>
      )
    }

    return (
      <>
        {searchInput}

        <div className='grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3'>
          {Object.entries(groupedPermissions).map(
            ([group, groupPermissions]) => {
              const groupSelectedCount = groupPermissions.filter((permission) =>
                selectedPermissionIds.includes(permission.id)
              ).length

              return (
                <div
                  key={group}
                  className='bg-card/50 overflow-hidden rounded-lg border'
                >
                  <div className='bg-muted/40 flex items-center justify-between gap-3 border-b p-4'>
                    <FormItem className='flex items-center gap-3 space-y-0'>
                      <Checkbox
                        checked={getGroupCheckedState(group)}
                        onCheckedChange={(checked) =>
                          toggleGroup(group, Boolean(checked))
                        }
                        disabled={disabled}
                      />
                      <div className='space-y-0.5'>
                        <label className='font-semibold'>
                          {formatSubjectLabel(group)}
                        </label>
                        <p className='text-muted-foreground text-xs'>
                          {groupSelectedCount}/{groupPermissions.length}{' '}
                          permissions selected
                        </p>
                      </div>
                    </FormItem>
                    <ShieldCheckIcon className='text-muted-foreground size-4' />
                  </div>

                  <div className='max-h-[348px] divide-y overflow-y-auto'>
                    {groupPermissions.map((permission) => (
                      <FormItem
                        key={permission.id}
                        className='hover:bg-muted/30 flex items-start gap-3 space-y-0 p-4 transition-colors'
                      >
                        <Checkbox
                          checked={isPermissionChecked(permission.id)}
                          onCheckedChange={(checked) =>
                            togglePermission(permission.id, Boolean(checked))
                          }
                          disabled={disabled}
                          className='mt-1'
                        />
                        <div className='min-w-0 flex-1 space-y-1'>
                          <div className='flex flex-wrap items-center gap-2'>
                            <label className='font-medium'>
                              {permission.name}
                            </label>
                            <Badge
                              variant='outline'
                              className='font-mono text-[11px]'
                            >
                              {getPermissionAction(permission.key)}
                            </Badge>
                          </div>
                          {permission.description && (
                            <p className='text-muted-foreground mt-1 text-sm leading-relaxed'>
                              {permission.description}
                            </p>
                          )}
                        </div>
                      </FormItem>
                    ))}
                  </div>
                </div>
              )
            }
          )}
        </div>
      </>
    )
  }

  return (
    <div className='col-span-3 space-y-2'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
        <div className='space-y-1'>
          <h6
            className={cn(
              form.formState.errors.permissionIds && 'text-destructive',
              'font-semibold'
            )}
          >
            {t('roles.create.permissions')}
          </h6>
          <p className='text-muted-foreground text-sm'>
            Select the capabilities this role should have. Full system access is
            reserved and cannot be assigned here.
          </p>
        </div>

        <Badge variant='secondary' className='w-fit'>
          {selectedCount} of {availableCount} selected
        </Badge>
      </div>

      {renderPermissionsContent()}

      {form.formState.errors.permissionIds && (
        <p className='text-sm text-red-500'>
          {form.formState.errors.permissionIds.message}
        </p>
      )}
    </div>
  )
}
