import * as React from "react";
import { ICON_TYPE, Icon } from "./icon";
import { SavedFilter } from "src/types";

export const SaveFilterMenu = ({
  savedFilters,
  loadSavedFilter,
  saveFilter,
  removeFilter,
}: {
  savedFilters: SavedFilter[];
  loadSavedFilter: (filter: SavedFilter) => void;
  saveFilter: () => void;
  removeFilter: (index: number) => void;
}) => {
  const [showPopover, setShowPopover] = React.useState(false);
  const ref = React.useRef(null);
  const iconRef = React.useRef(null);

  // Handle click outside of popover
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && event.target && iconRef.current) {
        const node = ref.current as Element;
        const iconNode = iconRef.current as Element;
        const elem = event.target as Element;
        if (
          !node.contains(elem) &&
          !iconNode.contains(elem) &&
          !elem.classList.contains("save-load-filters-icon-svg")
        ) {
          setShowPopover(false);
          event.preventDefault();
          event.stopPropagation();
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div style={{ position: "relative" }}>
      <div ref={iconRef} style={{ display: "inline-block" }}>
        <Icon
          className="save-load-filters-icon"
          iconType={ICON_TYPE.save}
          label="Save/load filters"
          onClick={() => {
            setShowPopover(!showPopover);
          }}
        />
      </div>

      {showPopover && (
        <div className="tag-view-popover" ref={ref}>
          <h4>Saved filters</h4>
          {savedFilters && savedFilters.length ? (
            <ul>
              {savedFilters.map((filter: SavedFilter, index: number) => (
                <li key={`saved-filter-${index}`}>
                  <span
                    onClick={() => {
                      loadSavedFilter(filter);
                      setShowPopover(false);
                    }}
                  >
                    {filter.name}
                  </span>

                  <Icon
                    className="trash-icon"
                    iconType={ICON_TYPE.trash}
                    onClick={() => {
                      removeFilter(index);
                    }}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="no-saved-filters">No saved filters</p>
          )}
          <hr />
          <div>
            <a
              className="save-link"
              onClick={() => {
                saveFilter();
              }}
            >
              <Icon
                className="save-icon"
                iconType={ICON_TYPE.save}
                label="Save filter"
              />
              Save filter
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
