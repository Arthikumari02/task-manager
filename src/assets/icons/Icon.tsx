import React from 'react';

// Define all SVG path data as constants
const ICON_PATHS = {
    plus: "M12 4v16m8-8H4",
    close: "M6 18L18 6M6 6l12 12",
    board: "M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 002 2h2a2 2 0 002-2",
    trash: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
    description: "M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2",
    activity: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
    search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
    user: "M15.9997 5.33301C13.053 5.33301 10.6663 7.71967 10.6663 10.6663C10.6663 13.613 13.053 15.9997 15.9997 15.9997C18.9463 15.9997 21.333 13.613 21.333 10.6663C21.333 7.71967 18.9463 5.33301 15.9997 5.33301ZM18.7997 10.6663C18.7997 9.11967 17.5463 7.86634 15.9997 7.86634C14.453 7.86634 13.1997 9.11967 13.1997 10.6663C13.1997 12.213 14.453 13.4663 15.9997 13.4663C17.5463 13.4663 18.7997 12.213 18.7997 10.6663ZM24.133 22.6663C24.133 21.813 19.9597 19.8663 15.9997 19.8663C12.0397 19.8663 7.86634 21.813 7.86634 22.6663V24.133H24.133V22.6663ZM5.33301 22.6663C5.33301 19.1197 12.4397 17.333 15.9997 17.333C19.5597 17.333 26.6663 19.1197 26.6663 22.6663V25.333C26.6663 26.0663 26.0663 26.6663 25.333 26.6663H6.66634C5.93301 26.6663 5.33301 26.0663 5.33301 25.333V22.6663Z",
    check: "M5 13l4 4L19 7",
    chevronDown: "M19 9l-7 7-7-7",
    chevronRight: "M9 5l7 7-7 7",
    menu: "M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z",
    home: "M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"
};

export type IconType = keyof typeof ICON_PATHS;

interface IconProps {
    type: IconType;
    className?: string;
    size?: number;
    color?: string;
    strokeWidth?: number;
    onClick?: () => void;
    title?: string;
}

const Icon: React.FC<IconProps> = ({
    type,
    className = "w-5 h-5",
    size,
    color = "currentColor",
    strokeWidth = 2,
    onClick,
    title
}) => {
    const sizeStyle = size ? { width: size, height: size } : {};
    const path = ICON_PATHS[type];

    if (!path) {
        console.error(`Icon type "${type}" not found`);
        return null;
    }

    return (
        <svg
            className={className}
            style={sizeStyle}
            fill="none"
            viewBox="0 0 24 24"
            stroke={color}
            onClick={onClick}
            role={onClick ? "button" : undefined}
            aria-label={title}
        >
            {title && <title>{title}</title>}
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={strokeWidth}
                d={path}
            />
        </svg>
    );
};

export default Icon;
