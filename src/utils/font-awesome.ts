import {
    config,
    library,
} from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css';
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import { 
    faSquare,
    faTerminal,
    faAngleDown
} from '@fortawesome/pro-solid-svg-icons';
import {
    faAsterisk
} from '@fortawesome/pro-light-svg-icons';
import {
    faHome,
    faAlien,
    faUsersClass,
    faVideo,
    faUserHeadset,
    faUniversalAccess,
    faUserGroup,
    faFile,
    faUserCircle,
    faSignIn,
    faUserPlus,
    faSignOut,
    faInfoCircle,
    faEye,
    faEyeSlash,
    faCog,
    faColumns
} from '@fortawesome/pro-duotone-svg-icons';
  
// See https://github.com/FortAwesome/react-fontawesome#integrating-with-other-tools-and-frameworks
config.autoAddCss = false; // Tell Font Awesome to skip adding the CSS automatically since it's being imported above

/**
 * Configure the Font-Awesome icons library by pre-registering icon definitions so that we do not have to explicitly pass them to render an icon.
 * Necessary for proper server-side rendering of icons.
 *
 * XXX Since Next.js 10, it is possible to import CSS file outside of the _app.tsx file.
 *  We leverage this new feature to configure our Font-Awesome icons outside of _app to avoid cluttering that file.
 *
 * @example <FontAwesomeIcon icon={['fas', 'home']} />
 *
 * @see https://fontawesome.com/how-to-use/javascript-api/methods/library-add
 * @see https://nextjs.org/blog/next-10#importing-css-from-third-party-react-components
 */

// Import @fortawesome/free-brands-svg-icons
library.add(
    faGithub
);

// Import @fortawesome/pro-regular-svg-icons
library.add();

// Import @fortawesome/pro-solid-svg-icons
library.add(
    faSquare,
    faTerminal,
    faAngleDown
);

library.add(
    faAsterisk
);

// Import @fortawesome/pro-duotone-svg-icons
library.add(
    faHome,
    faAlien,
    faUsersClass,
    faVideo,
    faUserHeadset,
    faUniversalAccess,
    faUserGroup,
    faFile,
    faUserCircle,
    faSignIn,
    faUserPlus,
    faSignOut,
    faInfoCircle,
    faEye,
    faEyeSlash,
    faCog,
    faColumns
);