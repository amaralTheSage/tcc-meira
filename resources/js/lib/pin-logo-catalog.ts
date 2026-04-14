import asanaLogoSvg from 'simple-icons/icons/asana.svg?raw';
import clickUpLogoSvg from 'simple-icons/icons/clickup.svg?raw';
import discordLogoSvg from 'simple-icons/icons/discord.svg?raw';
import figmaLogoSvg from 'simple-icons/icons/figma.svg?raw';
import gitHubLogoSvg from 'simple-icons/icons/github.svg?raw';
import gitLabLogoSvg from 'simple-icons/icons/gitlab.svg?raw';
import googleLogoSvg from 'simple-icons/icons/google.svg?raw';
import googleDriveLogoSvg from 'simple-icons/icons/googledrive.svg?raw';
import jiraLogoSvg from 'simple-icons/icons/jira.svg?raw';
import laravelLogoSvg from 'simple-icons/icons/laravel.svg?raw';
import linearLogoSvg from 'simple-icons/icons/linear.svg?raw';
import notionLogoSvg from 'simple-icons/icons/notion.svg?raw';
import slackLogoSvg from 'simple-icons/icons/slack.svg?raw';
import trelloLogoSvg from 'simple-icons/icons/trello.svg?raw';
import vercelLogoSvg from 'simple-icons/icons/vercel.svg?raw';

type PinnedLogoEntry = {
    searchTerms: readonly string[];
    svgMarkup: string;
};

const pinnedLogoCatalog: readonly PinnedLogoEntry[] = [
    { searchTerms: ['asana'], svgMarkup: asanaLogoSvg },
    { searchTerms: ['clickup', 'click up'], svgMarkup: clickUpLogoSvg },
    { searchTerms: ['discord'], svgMarkup: discordLogoSvg },
    { searchTerms: ['figma'], svgMarkup: figmaLogoSvg },
    { searchTerms: ['github', 'git hub'], svgMarkup: gitHubLogoSvg },
    { searchTerms: ['gitlab', 'git lab'], svgMarkup: gitLabLogoSvg },
    { searchTerms: ['googledrive', 'google drive', 'drive'], svgMarkup: googleDriveLogoSvg },
    { searchTerms: ['google'], svgMarkup: googleLogoSvg },
    { searchTerms: ['jira'], svgMarkup: jiraLogoSvg },
    { searchTerms: ['laravel'], svgMarkup: laravelLogoSvg },
    { searchTerms: ['linear'], svgMarkup: linearLogoSvg },
    { searchTerms: ['notion'], svgMarkup: notionLogoSvg },
    { searchTerms: ['slack'], svgMarkup: slackLogoSvg },
    { searchTerms: ['trello'], svgMarkup: trelloLogoSvg },
    { searchTerms: ['vercel'], svgMarkup: vercelLogoSvg },
];

function normalizePinnedLogoSearchTerm(searchTerm: string): string {
    const normalizedSearchTerm = searchTerm.toLowerCase().replace(/[^a-z0-9]+/g, '');

    return normalizedSearchTerm;
}

function encodePinnedLogoSvg(svgMarkup: string): string {
    const encodedSvgMarkup = encodeURIComponent(svgMarkup);

    return `data:image/svg+xml;charset=utf-8,${encodedSvgMarkup}`;
}

/**
 * Returns a small curated website logo data URI for project pins.
 *
 * @example
 * getPinnedWebsiteLogoDataUri('GitHub');
 */
export function getPinnedWebsiteLogoDataUri(websiteName: string): string | null {
    const normalizedWebsiteName = normalizePinnedLogoSearchTerm(websiteName);
    const logoEntry = pinnedLogoCatalog.find((candidateLogoEntry) =>
        candidateLogoEntry.searchTerms.some((searchTerm) => normalizedWebsiteName.includes(normalizePinnedLogoSearchTerm(searchTerm))),
    );

    if (!logoEntry) {
        return null;
    }

    return encodePinnedLogoSvg(logoEntry.svgMarkup);
}
