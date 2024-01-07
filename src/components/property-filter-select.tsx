import * as React from "react";
import { useEffect, useState } from "react";
import { ICON_TYPE, Icon } from "./icon";
import TagsOverviewPlugin from "src/main";
import { PropertyFilter } from "src/types";
import { FILTER_TYPES } from "src/constants";

export const PropertyFilterSelector = ({
  plugin,
  frontMatterProperties,
}: {
  plugin: TagsOverviewPlugin;
  frontMatterProperties: string[];
}) => {
  const [selectedPropertyFilters, setSelectedPropertyFilters] = useState<
    PropertyFilter[]
  >(plugin.settings.propertyFilters);

  useEffect(() => {
    savePropertyFilters();
  }, [selectedPropertyFilters]);

  const addPropertyFilter = (property: string) => {
    if (
      !selectedPropertyFilters.find(
        (selectedProperty) => selectedProperty.property === property
      )
    ) {
      setSelectedPropertyFilters([
        ...selectedPropertyFilters,
        { property, type: FILTER_TYPES.select },
      ]);
    }
  };

  const removePropertyFilter = (index: number) => {
    const tempPropertyFilters = [...selectedPropertyFilters];
    tempPropertyFilters.splice(index, 1);
    setSelectedPropertyFilters([...tempPropertyFilters]);
  };

  const movePropertyFilter = (
    propertyFilter: PropertyFilter,
    direction: number
  ) => {
    const index = selectedPropertyFilters.indexOf(propertyFilter);
    const tempPropertyFilters = [...selectedPropertyFilters];
    const temp = tempPropertyFilters[index + direction];
    tempPropertyFilters[index + direction] = propertyFilter;
    tempPropertyFilters[index] = temp;
    setSelectedPropertyFilters(tempPropertyFilters);
  };

  const setFilterType = (propertyFilter: PropertyFilter, value: string) => {
    const index = selectedPropertyFilters.indexOf(propertyFilter);
    const tempPropertyFilters = [...selectedPropertyFilters];
    tempPropertyFilters[index].type = value;
    setSelectedPropertyFilters(tempPropertyFilters);
  };

  const savePropertyFilters = async () => {
    plugin.settings.propertyFilters = selectedPropertyFilters;
    await plugin.saveData(plugin.settings);
    plugin.refreshView();
  };

  const selectedTypes: string[] = selectedPropertyFilters.map(
    (propertyFilter: PropertyFilter) => propertyFilter.property
  );

  const tableRows =
    selectedPropertyFilters.length === 0 ? (
      <tr>
        <td colSpan={3} className="no-columns-added">
          <i>No extra filters added</i>
          <p>The default ones will be displayed</p>
        </td>
      </tr>
    ) : (
      selectedPropertyFilters.map(
        (propertyFilter: PropertyFilter, index: number) => (
          <tr key={`${propertyFilter.property}-${index}`}>
            <td>{propertyFilter.property}</td>
            <td style={{ textAlign: "center" }}>
              <select
                onChange={(e) => setFilterType(propertyFilter, e.target.value)}
                value={propertyFilter.type}
              >
                {Object.values(FILTER_TYPES).map((filterType) => (
                  <option
                    key={`${propertyFilter.property}-${index}-${filterType}`}
                    value={filterType}
                  >
                    {filterType}
                  </option>
                ))}
              </select>
            </td>
            <td style={{ textAlign: "right" }}>
              {index > 0 && (
                <Icon
                  className="move-up-icon"
                  iconType={ICON_TYPE.moveUp}
                  onClick={() => {
                    movePropertyFilter(propertyFilter, -1);
                  }}
                />
              )}
              {index < selectedPropertyFilters.length - 1 && (
                <Icon
                  className="move-down-icon"
                  iconType={ICON_TYPE.moveDown}
                  onClick={() => {
                    movePropertyFilter(propertyFilter, 1);
                  }}
                />
              )}
              <Icon
                className="trash-icon"
                iconType={ICON_TYPE.trash}
                onClick={() => {
                  removePropertyFilter(index);
                }}
              />
            </td>
          </tr>
        )
      )
    );

  return (
    <div>
      <table className="tags-overview-settings-table">
        <thead>
          <tr>
            <th>Property</th>
            <th style={{ textAlign: "center" }}>Filter type</th>
            <th style={{ width: "120px" }}></th>
          </tr>
        </thead>
        <tbody>{tableRows}</tbody>
        <tfoot>
          <tr>
            <td colSpan={3}>
              <span style={{ display: "inline-block", marginRight: "15px" }}>
                Add filter:
              </span>
              <select
                onChange={(e) => addPropertyFilter(e.target.value)}
                className="dropdown"
              >
                <option value="">Select property to add</option>
                {frontMatterProperties
                  .filter((property) => !selectedTypes.includes(property))
                  .map((property) => (
                    <option key={property} value={property}>
                      {property}
                    </option>
                  ))}
              </select>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};
