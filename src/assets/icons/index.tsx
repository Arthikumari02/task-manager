import Icon, { IconType } from './Icon';

export { Icon };
export type { IconType };
export default Icon;

// Legacy exports for backward compatibility
export const PlusIcon = (props: any) => <Icon type="plus" {...props} />;
export const CloseIcon = (props: any) => <Icon type="close" {...props} />;
export const BoardIcon = (props: any) => <Icon type="board" {...props} />;
export const SearchIcon = (props: any) => <Icon type="search" {...props} />;
export const TrashIcon = (props: any) => <Icon type="trash" {...props} />;
export const DescriptionIcon = (props: any) => <Icon type="description" {...props} />;
export const ActivityIcon = (props: any) => <Icon type="activity" {...props} />;
