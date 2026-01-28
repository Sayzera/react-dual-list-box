import React, { useEffect, useMemo, useCallback, useRef } from "react";
import { Card, Divider, Checkbox, Grid, Button as MuiButton, TextField, InputAdornment, ListItemButton, ListItemIcon, ListItemText, CardHeader } from "@mui/material";
import { Virtuoso } from "react-virtuoso";
import { Search } from "lucide-react";

// TYPES 
export interface Option {
    value: number;
    label: string;
    id: number;
}

export interface ItemGroup {
    id: number;
    label: string;
    options: Option[];
}

// Virtualized list item types
type ListItem =
    | { type: 'group'; id: string; label: string; groupId: number }
    | { type: 'option'; id: number; label: string; groupId: number; option: Option }

// Props interface
export interface DualBoxProps {
    leftItems: ItemGroup[];
    rightItems: ItemGroup[];
    onChange: (leftItems: ItemGroup[], rightItems: ItemGroup[]) => void;
    leftTitle?: string;
    rightTitle?: string;
    height?: number;
    width?: number;
    disabled?: boolean;
}

// Utility functions operating on arrays of numbers (IDs)
function not(a: readonly number[], b: readonly number[]): number[] {
    return a.filter((value) => !b.includes(value))
}

function intersection(a: readonly number[], b: readonly number[]): number[] {
    return a.filter((value) => b.includes(value))
}

function union(a: readonly number[], b: readonly number[]): number[] {
    return [...a, ...not(b, a)]
}

const DualBox: React.FC<DualBoxProps> = ({
    leftItems: initialLeftItems,
    rightItems: initialRightItems,
    onChange,
    leftTitle = "Mevcut Yetkiler",
    rightTitle = "Atanan Yetkiler",
    height = 350,
    width = 300,
    disabled = false,
}) => {
    const [checked, setChecked] = React.useState<readonly number[]>([])
    const checkedRef = useRef<readonly number[]>([])
    const [leftItems, setLeftItems] = React.useState<readonly ItemGroup[]>(initialLeftItems)
    const [rightItems, setRightItems] = React.useState<readonly ItemGroup[]>(initialRightItems)
    const [leftSearch, setLeftSearch] = React.useState<string>("")
    const [rightSearch, setRightSearch] = React.useState<string>("")

    // Sync with props changes
    useEffect(() => {
        setLeftItems(initialLeftItems)
    }, [initialLeftItems])

    useEffect(() => {
        setRightItems(initialRightItems)
    }, [initialRightItems])

    // checked state'ini ref'te de tut (closure sorununu önlemek için)
    useEffect(() => {
        checkedRef.current = checked
    }, [checked])

    // Tüm option ID'lerini topla (grup değil, option seviyesinde) - Memoized
    const getAllOptionIds = useCallback((items: readonly ItemGroup[]): number[] => {
        return items.flatMap(item => item.options.map(opt => opt.id))
    }, [])

    // Memoized option ID arrays
    const leftOptionIds = useMemo(() => getAllOptionIds(leftItems), [leftItems, getAllOptionIds])
    const rightOptionIds = useMemo(() => getAllOptionIds(rightItems), [rightItems, getAllOptionIds])

    // Memoized checked IDs
    const leftCheckedIds = useMemo(() => intersection(checked, leftOptionIds), [checked, leftOptionIds])
    const rightCheckedIds = useMemo(() => intersection(checked, rightOptionIds), [checked, rightOptionIds])

    const handleToggle = (value: number) => () => {
        if (disabled) return;
        const currentIndex = checked.indexOf(value)
        const newChecked = [...checked]

        if (currentIndex === -1) {
            newChecked.push(value)
        } else {
            newChecked.splice(currentIndex, 1)
        }

        setChecked(newChecked)
    }

    const numberOfChecked = (itemIds: readonly number[]) =>
        intersection(checked, itemIds).length

    const handleToggleAll = (itemIds: readonly number[]) => () => {
        if (disabled) return;
        if (numberOfChecked(itemIds) === itemIds.length) {
            setChecked(not(checked, itemIds))
        } else {
            setChecked(union(checked, itemIds))
        }
    }

    const handleCheckedRight = useCallback(() => {
        if (disabled) return;
        // Önce checked ID'leri hesapla
        const currentLeftOptionIds = getAllOptionIds(leftItems)
        const currentLeftCheckedIds = intersection(checkedRef.current, currentLeftOptionIds)
        const currentRightOptionIds = getAllOptionIds(rightItems)

        // Sağ tarafta zaten olan option ID'lerini filtrele (duplicate kontrolü)
        const optionsToMoveIds = currentLeftCheckedIds.filter(id => !currentRightOptionIds.includes(id))

        if (optionsToMoveIds.length === 0) {
            // Taşınacak item yok, sadece checked'i temizle
            setChecked(prevChecked => not(prevChecked, currentLeftCheckedIds))
            return
        }

        let newLeftGroups: ItemGroup[] = []
        const rightGroupsToUpdate: Map<number, Option[]> = new Map()

        leftItems.forEach(group => {
            // Sadece sağ tarafta olmayan ve seçili olan option'ları taşı
            const optionsToMove = group.options.filter(opt => optionsToMoveIds.includes(opt.id))
            const optionsToKeep = group.options.filter(opt => !optionsToMoveIds.includes(opt.id))

            if (optionsToMove.length > 0) {
                if (rightGroupsToUpdate.has(group.id)) {
                    rightGroupsToUpdate.get(group.id)!.push(...optionsToMove)
                } else {
                    rightGroupsToUpdate.set(group.id, [...optionsToMove])
                }

                if (optionsToKeep.length > 0) {
                    newLeftGroups.push({
                        ...group,
                        options: [...optionsToKeep]
                    })
                }
            } else {
                newLeftGroups.push(group)
            }
        })

        // Update right items
        let newRightGroups: ItemGroup[] = [...rightItems]
        if (rightGroupsToUpdate.size > 0) {
            rightGroupsToUpdate.forEach((options, groupId) => {
                const existingRightGroup = newRightGroups.find(g => g.id === groupId)
                if (existingRightGroup) {
                    // Duplicate kontrolü: Sadece olmayan option'ları ekle
                    const newOptions = options.filter(opt =>
                        !existingRightGroup.options.some(existingOpt => existingOpt.id === opt.id)
                    )
                    existingRightGroup.options.push(...newOptions)
                } else {
                    const sourceGroup = leftItems.find(g => g.id === groupId)
                    if (sourceGroup) {
                        newRightGroups.push({
                            ...sourceGroup,
                            options: [...options]
                        })
                    }
                }
            })
        }

        // Update states and notify parent
        setLeftItems(newLeftGroups)
        setRightItems(newRightGroups)
        onChange(newLeftGroups, newRightGroups)

        // Update checked state - taşınan item'ları checked'den çıkar
        setChecked(prevChecked => not(prevChecked, currentLeftCheckedIds))
    }, [leftItems, rightItems, getAllOptionIds, disabled, onChange])

    const handleCheckedLeft = useCallback(() => {
        if (disabled) return;
        // Önce checked ID'leri hesapla
        const currentRightOptionIds = getAllOptionIds(rightItems)
        const currentRightCheckedIds = intersection(checkedRef.current, currentRightOptionIds)
        const currentLeftOptionIds = getAllOptionIds(leftItems)

        // Sol tarafta zaten olan option ID'lerini filtrele (duplicate kontrolü)
        const optionsToMoveIds = currentRightCheckedIds.filter(id => !currentLeftOptionIds.includes(id))

        if (optionsToMoveIds.length === 0) {
            // Taşınacak item yok, sadece checked'i temizle
            setChecked(prevChecked => not(prevChecked, currentRightCheckedIds))
            return
        }

        let newRightGroups: ItemGroup[] = []
        const leftGroupsToUpdate: Map<number, Option[]> = new Map()

        rightItems.forEach(group => {
            // Sadece sol tarafta olmayan ve seçili olan option'ları taşı
            const optionsToMove = group.options.filter(opt => optionsToMoveIds.includes(opt.id))
            const optionsToKeep = group.options.filter(opt => !optionsToMoveIds.includes(opt.id))

            if (optionsToMove.length > 0) {
                if (leftGroupsToUpdate.has(group.id)) {
                    leftGroupsToUpdate.get(group.id)!.push(...optionsToMove)
                } else {
                    leftGroupsToUpdate.set(group.id, [...optionsToMove])
                }

                if (optionsToKeep.length > 0) {
                    newRightGroups.push({
                        ...group,
                        options: [...optionsToKeep]
                    })
                }
            } else {
                newRightGroups.push(group)
            }
        })

        // Update left items
        let newLeftGroups: ItemGroup[] = [...leftItems]
        if (leftGroupsToUpdate.size > 0) {
            leftGroupsToUpdate.forEach((options, groupId) => {
                const existingLeftGroup = newLeftGroups.find(g => g.id === groupId)
                if (existingLeftGroup) {
                    // Duplicate kontrolü: Sadece olmayan option'ları ekle
                    const newOptions = options.filter(opt =>
                        !existingLeftGroup.options.some(existingOpt => existingOpt.id === opt.id)
                    )
                    existingLeftGroup.options.push(...newOptions)
                } else {
                    const sourceGroup = rightItems.find(g => g.id === groupId)
                    if (sourceGroup) {
                        newLeftGroups.push({
                            ...sourceGroup,
                            options: [...options]
                        })
                    }
                }
            })
        }

        // Update states and notify parent
        setLeftItems(newLeftGroups)
        setRightItems(newRightGroups)
        onChange(newLeftGroups, newRightGroups)

        // Update checked state - taşınan item'ları checked'den çıkar
        setChecked(prevChecked => not(prevChecked, currentRightCheckedIds))
    }, [leftItems, rightItems, getAllOptionIds, disabled, onChange])

    // Items'ı flat list'e çevir (virtualization için) - Memoized
    const flattenItems = useCallback((items: readonly ItemGroup[], searchFilter?: string): ListItem[] => {
        const flatList: ListItem[] = []
        const searchLower = searchFilter?.toLowerCase() || ""

        items.forEach(group => {
            // Grup adını filtrele
            const groupMatches = !searchLower || group.label.toLowerCase().includes(searchLower)

            // Grup içindeki options'ları filtrele
            const filteredOptions = group.options.filter(option =>
                !searchLower || option.label.toLowerCase().includes(searchLower)
            )

            // Eğer grup veya options eşleşiyorsa ekle
            if (groupMatches || filteredOptions.length > 0) {
                flatList.push({
                    type: 'group',
                    id: `group-${group.id}`,
                    label: group.label,
                    groupId: group.id,
                })

                // Filtrelenmiş options'ları ekle
                filteredOptions.forEach(option => {
                    flatList.push({
                        type: 'option',
                        id: option.id,
                        label: option.label,
                        groupId: group.id,
                        option: option,
                    })
                })
            }
        })
        return flatList
    }, [])

    // Arama sonuçlarından gelenleri toplu sağa taşı
    const handleSearchResultsRight = useCallback(() => {
        if (disabled) return;
        if (!leftSearch.trim()) {
            return // Arama yoksa işlem yapma
        }

        // Arama sonuçlarındaki option ID'lerini al
        const flatList = flattenItems(leftItems, leftSearch)
        const searchResultOptionIds = flatList
            .filter(item => item.type === 'option')
            .map(item => item.id)

        if (searchResultOptionIds.length === 0) {
            return // Arama sonucu yoksa işlem yapma
        }

        const currentLeftOptionIds = getAllOptionIds(leftItems)
        const currentRightOptionIds = getAllOptionIds(rightItems)

        // Sağ tarafta zaten olan option ID'lerini filtrele (duplicate kontrolü)
        const optionsToMoveIds = searchResultOptionIds.filter(id =>
            currentLeftOptionIds.includes(id) && !currentRightOptionIds.includes(id)
        )

        if (optionsToMoveIds.length === 0) {
            return
        }

        let newLeftGroups: ItemGroup[] = []
        const rightGroupsToUpdate: Map<number, Option[]> = new Map()

        leftItems.forEach(group => {
            // Sadece sağ tarafta olmayan ve arama sonucunda olan option'ları taşı
            const optionsToMove = group.options.filter(opt => optionsToMoveIds.includes(opt.id))
            const optionsToKeep = group.options.filter(opt => !optionsToMoveIds.includes(opt.id))

            if (optionsToMove.length > 0) {
                if (rightGroupsToUpdate.has(group.id)) {
                    rightGroupsToUpdate.get(group.id)!.push(...optionsToMove)
                } else {
                    rightGroupsToUpdate.set(group.id, [...optionsToMove])
                }

                if (optionsToKeep.length > 0) {
                    newLeftGroups.push({
                        ...group,
                        options: [...optionsToKeep]
                    })
                }
            } else {
                newLeftGroups.push(group)
            }
        })

        // Update right items
        let newRightGroups: ItemGroup[] = [...rightItems]
        if (rightGroupsToUpdate.size > 0) {
            rightGroupsToUpdate.forEach((options, groupId) => {
                const existingRightGroup = newRightGroups.find(g => g.id === groupId)
                if (existingRightGroup) {
                    // Duplicate kontrolü: Sadece olmayan option'ları ekle
                    const newOptions = options.filter(opt =>
                        !existingRightGroup.options.some(existingOpt => existingOpt.id === opt.id)
                    )
                    existingRightGroup.options.push(...newOptions)
                } else {
                    const sourceGroup = leftItems.find(g => g.id === groupId)
                    if (sourceGroup) {
                        newRightGroups.push({
                            ...sourceGroup,
                            options: [...options]
                        })
                    }
                }
            })
        }

        // Update states and notify parent
        setLeftItems(newLeftGroups)
        setRightItems(newRightGroups)
        onChange(newLeftGroups, newRightGroups)

        // Arama sonuçlarındaki item'ları checked'den çıkar
        setChecked(prevChecked => not(prevChecked, searchResultOptionIds))
    }, [leftItems, rightItems, leftSearch, getAllOptionIds, flattenItems, disabled, onChange])

    // Arama sonuçlarından gelenleri toplu sola taşı
    const handleSearchResultsLeft = useCallback(() => {
        if (disabled) return;
        if (!rightSearch.trim()) {
            return // Arama yoksa işlem yapma
        }

        // Arama sonuçlarındaki option ID'lerini al
        const flatList = flattenItems(rightItems, rightSearch)
        const searchResultOptionIds = flatList
            .filter(item => item.type === 'option')
            .map(item => item.id)

        if (searchResultOptionIds.length === 0) {
            return // Arama sonucu yoksa işlem yapma
        }

        const currentRightOptionIds = getAllOptionIds(rightItems)
        const currentLeftOptionIds = getAllOptionIds(leftItems)

        // Sol tarafta zaten olan option ID'lerini filtrele (duplicate kontrolü)
        const optionsToMoveIds = searchResultOptionIds.filter(id =>
            currentRightOptionIds.includes(id) && !currentLeftOptionIds.includes(id)
        )

        if (optionsToMoveIds.length === 0) {
            return
        }

        let newRightGroups: ItemGroup[] = []
        const leftGroupsToUpdate: Map<number, Option[]> = new Map()

        rightItems.forEach(group => {
            // Sadece sol tarafta olmayan ve arama sonucunda olan option'ları taşı
            const optionsToMove = group.options.filter(opt => optionsToMoveIds.includes(opt.id))
            const optionsToKeep = group.options.filter(opt => !optionsToMoveIds.includes(opt.id))

            if (optionsToMove.length > 0) {
                if (leftGroupsToUpdate.has(group.id)) {
                    leftGroupsToUpdate.get(group.id)!.push(...optionsToMove)
                } else {
                    leftGroupsToUpdate.set(group.id, [...optionsToMove])
                }

                if (optionsToKeep.length > 0) {
                    newRightGroups.push({
                        ...group,
                        options: [...optionsToKeep]
                    })
                }
            } else {
                newRightGroups.push(group)
            }
        })

        // Update left items
        let newLeftGroups: ItemGroup[] = [...leftItems]
        if (leftGroupsToUpdate.size > 0) {
            leftGroupsToUpdate.forEach((options, groupId) => {
                const existingLeftGroup = newLeftGroups.find(g => g.id === groupId)
                if (existingLeftGroup) {
                    // Duplicate kontrolü: Sadece olmayan option'ları ekle
                    const newOptions = options.filter(opt =>
                        !existingLeftGroup.options.some(existingOpt => existingOpt.id === opt.id)
                    )
                    existingLeftGroup.options.push(...newOptions)
                } else {
                    const sourceGroup = rightItems.find(g => g.id === groupId)
                    if (sourceGroup) {
                        newLeftGroups.push({
                            ...sourceGroup,
                            options: [...options]
                        })
                    }
                }
            })
        }

        // Update states and notify parent
        setLeftItems(newLeftGroups)
        setRightItems(newRightGroups)
        onChange(newLeftGroups, newRightGroups)

        // Arama sonuçlarındaki item'ları checked'den çıkar
        setChecked(prevChecked => not(prevChecked, searchResultOptionIds))
    }, [leftItems, rightItems, rightSearch, getAllOptionIds, flattenItems, disabled, onChange])

    // Memoized item content renderer
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const itemContent = useCallback((_index: number, item: ListItem) => {
        if (item.type === 'group') {
            return (
                <ListItemButton
                    sx={{
                        backgroundColor: 'rgba(0, 0, 0, 0.04)',
                        fontWeight: 'bold',
                        py: 0.5,
                    }}
                    disabled
                >
                    <ListItemText
                        primary={item.label}
                        primaryTypographyProps={{
                            fontWeight: 'bold',
                            fontSize: '0.875rem',
                        }}
                    />
                </ListItemButton>
            )
        } else {
            const value = item.id
            const labelId = `transfer-list-item-${value}-label`

            return (
                <ListItemButton
                    role="listitem"
                    onClick={handleToggle(value)}
                    sx={{ pl: 4, py: 0.2 }}
                    disabled={disabled}
                >
                    <ListItemIcon>
                        <Checkbox
                            checked={checked.includes(value)}
                            tabIndex={-1}
                            disableRipple
                            disabled={disabled}
                            inputProps={{
                                'aria-labelledby': labelId,
                            }}
                        />
                    </ListItemIcon>
                    <ListItemText
                        primaryTypographyProps={{
                            fontSize: '0.875rem',
                        }}
                        id={labelId}
                        primary={item.label}
                    />
                </ListItemButton>
            )
        }
    }, [checked, handleToggle, disabled])

    const customList = useCallback((title: React.ReactNode, items: readonly ItemGroup[], searchValue: string, onSearchChange: (value: string) => void) => {
        // Memoized calculations
        const allOptionIds = getAllOptionIds(items)
        const checkedCount = numberOfChecked(allOptionIds)
        const totalOptions = allOptionIds.length
        const flatList = flattenItems(items, searchValue)

        return (
            <Card>
                <CardHeader
                    sx={{ px: 2, py: 1 }}
                    avatar={
                        <Checkbox
                            onClick={handleToggleAll(allOptionIds)}
                            checked={checkedCount === totalOptions && totalOptions !== 0}
                            indeterminate={
                                checkedCount !== totalOptions && checkedCount !== 0
                            }
                            disabled={totalOptions === 0 || disabled}
                            inputProps={{
                                'aria-label': `Tüme ${title} seçildi`,
                            }}
                        />
                    }
                    title={title}
                    subheader={`${checkedCount}/${totalOptions} seçildi`}
                />
                <Divider />
                <TextField
                    fullWidth
                    size="small"
                    placeholder="Ara..."
                    value={searchValue}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value)}
                    disabled={disabled}
                    sx={{
                        px: 1,
                        py: 0.5,
                        '& .MuiOutlinedInput-root': {
                            fontSize: '0.875rem',
                        }
                    }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search size={18} style={{ opacity: 0.5 }} />
                            </InputAdornment>
                        ),
                    }}
                />
                <Divider />
                <div style={{ width, height }}>
                    <Virtuoso
                        data={flatList}
                        itemContent={itemContent}
                        style={{ height, width }}
                    />
                </div>
            </Card>
        )
    }, [getAllOptionIds, numberOfChecked, flattenItems, itemContent, width, height, disabled, handleToggleAll])

    // Move all right handler
    const handleMoveAllRight = useCallback(() => {
        if (disabled) return;
        // Eğer arama yapılmışsa, sadece arama sonuçlarını taşı
        if (leftSearch.trim()) {
            handleSearchResultsRight()
            return
        }

        // Arama yoksa tümünü taşı
        // Önce sağ tarafta zaten olan option ID'lerini al (duplicate kontrolü için)
        const existingRightOptionIds = getAllOptionIds(rightItems)

        // Sağa taşınacak option'ları hesapla
        const rightGroupsToAdd: Map<number, Option[]> = new Map()
        leftItems.forEach(group => {
            // Sadece sağ tarafta olmayan option'ları taşı
            const optionsToMove = group.options.filter(opt =>
                !existingRightOptionIds.includes(opt.id)
            )

            if (optionsToMove.length > 0) {
                rightGroupsToAdd.set(group.id, [...optionsToMove])
            }
        })

        // Sağ tarafı güncelle
        let newRightGroups: ItemGroup[] = [...rightItems]
        if (rightGroupsToAdd.size > 0) {
            rightGroupsToAdd.forEach((options, groupId) => {
                const existingRightGroup = newRightGroups.find(g => g.id === groupId)
                if (existingRightGroup) {
                    // Duplicate kontrolü: Sadece olmayan option'ları ekle
                    const newOptions = options.filter(opt =>
                        !existingRightGroup.options.some(existingOpt => existingOpt.id === opt.id)
                    )
                    existingRightGroup.options.push(...newOptions)
                } else {
                    const sourceGroup = leftItems.find(g => g.id === groupId)
                    if (sourceGroup) {
                        newRightGroups.push({
                            ...sourceGroup,
                            options: [...options]
                        })
                    }
                }
            })
        }

        // Sol taraftan taşınanları kaldır
        const movedOptionIds = Array.from(rightGroupsToAdd.values()).flat().map(opt => opt.id)
        const newLeftGroups: ItemGroup[] = []
        leftItems.forEach(group => {
            // Taşınan option'ları hariç tut
            const optionsToKeep = group.options.filter(opt =>
                !movedOptionIds.includes(opt.id)
            )

            if (optionsToKeep.length > 0) {
                newLeftGroups.push({
                    ...group,
                    options: [...optionsToKeep]
                })
            }
        })

        // Update states and notify parent
        setLeftItems(newLeftGroups)
        setRightItems(newRightGroups)
        onChange(newLeftGroups, newRightGroups)

        setChecked([])
    }, [leftItems, rightItems, leftSearch, getAllOptionIds, handleSearchResultsRight, disabled, onChange])

    // Move all left handler
    const handleMoveAllLeft = useCallback(() => {
        if (disabled) return;
        // Eğer arama yapılmışsa, sadece arama sonuçlarını taşı
        if (rightSearch.trim()) {
            handleSearchResultsLeft()
            return
        }

        // Arama yoksa tümünü taşı
        // Önce sol tarafta zaten olan option ID'lerini al (duplicate kontrolü için)
        const existingLeftOptionIds = getAllOptionIds(leftItems)

        // Sola taşınacak option'ları hesapla
        const leftGroupsToAdd: Map<number, Option[]> = new Map()
        rightItems.forEach(group => {
            // Sadece sol tarafta olmayan option'ları taşı
            const optionsToMove = group.options.filter(opt =>
                !existingLeftOptionIds.includes(opt.id)
            )

            if (optionsToMove.length > 0) {
                leftGroupsToAdd.set(group.id, [...optionsToMove])
            }
        })

        // Sol tarafı güncelle
        let newLeftGroups: ItemGroup[] = [...leftItems]
        if (leftGroupsToAdd.size > 0) {
            leftGroupsToAdd.forEach((options, groupId) => {
                const existingLeftGroup = newLeftGroups.find(g => g.id === groupId)
                if (existingLeftGroup) {
                    // Duplicate kontrolü: Sadece olmayan option'ları ekle
                    const newOptions = options.filter(opt =>
                        !existingLeftGroup.options.some(existingOpt => existingOpt.id === opt.id)
                    )
                    existingLeftGroup.options.push(...newOptions)
                } else {
                    const sourceGroup = rightItems.find(g => g.id === groupId)
                    if (sourceGroup) {
                        newLeftGroups.push({
                            ...sourceGroup,
                            options: [...options]
                        })
                    }
                }
            })
        }

        // Sağ taraftan taşınanları kaldır
        const movedOptionIds = Array.from(leftGroupsToAdd.values()).flat().map(opt => opt.id)
        const newRightGroups: ItemGroup[] = []
        rightItems.forEach(group => {
            // Taşınan option'ları hariç tut
            const optionsToKeep = group.options.filter(opt =>
                !movedOptionIds.includes(opt.id)
            )

            if (optionsToKeep.length > 0) {
                newRightGroups.push({
                    ...group,
                    options: [...optionsToKeep]
                })
            }
        })

        // Update states and notify parent
        setLeftItems(newLeftGroups)
        setRightItems(newRightGroups)
        onChange(newLeftGroups, newRightGroups)

        setChecked([])
    }, [leftItems, rightItems, rightSearch, getAllOptionIds, handleSearchResultsLeft, disabled, onChange])

    return (
        <Grid
            container
            spacing={2}
            justifyContent="center"
            alignItems="center"
            sx={{ px: 2 }}
        >
            <Grid item>{customList(leftTitle, leftItems, leftSearch, setLeftSearch)}</Grid>
            <Grid item>
                <Grid container direction="column" alignItems="center">
                    <MuiButton
                        sx={{ my: 0.5 }}
                        variant="outlined"
                        size="small"
                        onClick={handleMoveAllRight}
                        disabled={leftOptionIds.length === 0 || disabled}
                        aria-label="move all right"
                    >
                        ≫
                    </MuiButton>
                    <MuiButton
                        sx={{ my: 0.5 }}
                        variant="outlined"
                        size="small"
                        onClick={handleCheckedRight}
                        disabled={leftCheckedIds.length === 0 || disabled}
                        aria-label="move selected right"
                    >
                        &gt;
                    </MuiButton>
                    <MuiButton
                        sx={{ my: 0.5 }}
                        variant="outlined"
                        size="small"
                        onClick={handleCheckedLeft}
                        disabled={rightCheckedIds.length === 0 || disabled}
                        aria-label="move selected left"
                    >
                        &lt;
                    </MuiButton>
                    <MuiButton
                        sx={{ my: 0.5 }}
                        variant="outlined"
                        size="small"
                        onClick={handleMoveAllLeft}
                        disabled={rightOptionIds.length === 0 || disabled}
                        aria-label="move all left"
                    >
                        ≪
                    </MuiButton>
                </Grid>
            </Grid>
            <Grid item>{customList(rightTitle, rightItems, rightSearch, setRightSearch)}</Grid>
        </Grid>
    )
}

export default DualBox
