import React, { useEffect, useState } from "react";
import { ICON_TYPE, Icon } from "./icon";
import TagsOverviewPlugin from "src/main";
import { TableColumn } from "src/types";

export const TABLE_COLUMN_TYPES = {
  name: "name",
  modified: "modified",
  created: "created",
  size: "size",
  frontMatter: "frontMatter",
};

export const ALIGN_OPTIONS = {
  left: "left",
  center: "center",
  right: "right",
};

export const TableColumnsSelector = ({
  plugin,
  frontMatterProperties,
}: {
  plugin: TagsOverviewPlugin;
  frontMatterProperties: string[];
}) => {
  const [selectedColumns, setSelectedColumns] = useState<TableColumn[]>(
    plugin.settings.tableColumns
  );

  useEffect(() => {
    saveColumns();
  }, [selectedColumns]);

  const addColumn = (columnType: string) => {
    // Front matter is the only column that can be added multiple times
    if (
      columnType === "frontMatter" ||
      !selectedColumns.find((col) => col.type === columnType)
    ) {
      setSelectedColumns([
        ...selectedColumns,
        { type: columnType, align: "left" },
      ]);
    }
  };

  const removeColumn = (index: number) => {
    const tempColumns = [...selectedColumns];
    tempColumns.splice(index, 1);
    setSelectedColumns([...tempColumns]);
  };

  const moveColumn = (column: TableColumn, direction: number) => {
    const index = selectedColumns.indexOf(column);
    const tempColumns = [...selectedColumns];
    const temp = tempColumns[index + direction];
    tempColumns[index + direction] = column;
    tempColumns[index] = temp;
    setSelectedColumns(tempColumns);
  };

  const setAlignment = (column: TableColumn, value: string) => {
    const index = selectedColumns.indexOf(column);
    const tempColumns = [...selectedColumns];
    tempColumns[index].align = value;
    setSelectedColumns(tempColumns);
  };

  const setProperty = (column: TableColumn, value: string) => {
    const index = selectedColumns.indexOf(column);
    const tempColumns = [...selectedColumns];
    tempColumns[index].data = value;
    setSelectedColumns(tempColumns);
  };

  const saveColumns = async () => {
    plugin.settings.tableColumns = selectedColumns;
    await plugin.saveData(plugin.settings);
    plugin.refreshView();
  };

  const selectedTypes: string[] = selectedColumns.map(
    (column: TableColumn) => column.type
  );

  const tableRows =
    selectedColumns.length === 0 ? (
      <tr>
        <td colSpan={3} className="no-columns-added">
          <i>No columns added</i>
        </td>
      </tr>
    ) : (
      selectedColumns.map((column: TableColumn, index: number) => (
        <tr key={`${column}-${index}`}>
          <td>
            {column.type}
            {column.type === "frontMatter" && (
              <span className="front-matter-note">
                <select
                  onChange={(e) => setProperty(column, e.target.value)}
                  value={column.data}
                >
                  <option value="">Select property</option>
                  {frontMatterProperties.map((property) => (
                    <option
                      key={`${column}-${index}-${property}`}
                      value={property}
                    >
                      {property}
                    </option>
                  ))}
                </select>
              </span>
            )}
          </td>
          <td style={{ textAlign: "center" }}>
            <select
              onChange={(e) => setAlignment(column, e.target.value)}
              value={column.align}
            >
              {Object.values(ALIGN_OPTIONS).map((alignOption) => (
                <option
                  key={`${column}-${index}-${alignOption}`}
                  value={alignOption}
                >
                  {alignOption}
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
                  moveColumn(column, -1);
                }}
              />
            )}
            {index < selectedColumns.length - 1 && (
              <Icon
                className="move-down-icon"
                iconType={ICON_TYPE.moveDown}
                onClick={() => {
                  moveColumn(column, 1);
                }}
              />
            )}
            <Icon
              className="trash-icon"
              iconType={ICON_TYPE.trash}
              onClick={() => {
                removeColumn(index);
              }}
            />
          </td>
        </tr>
      ))
    );

  return (
    <div>
      <table className="tags-overview-settings-table">
        <thead>
          <tr>
            <th>Column type</th>
            <th style={{ width: "150px", textAlign: "center" }}>Aligment</th>
            <th style={{ width: "120px" }}></th>
          </tr>
        </thead>
        <tbody>{tableRows}</tbody>
        <tfoot>
          <tr>
            <td colSpan={3}>
              <span style={{ display: "inline-block", marginRight: "15px" }}>
                Add column:
              </span>
              <select
                onChange={(e) => addColumn(e.target.value)}
                className="dropdown"
                value=""
              >
                <option value="">Select column to add</option>
                {Object.values(TABLE_COLUMN_TYPES)
                  .filter((columnType) => {
                    return (
                      !selectedTypes.includes(columnType) ||
                      columnType === TABLE_COLUMN_TYPES.frontMatter
                    );
                  })
                  .map((column, index) => (
                    <option key={`${column}-${index}`} value={column}>
                      {column}
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
