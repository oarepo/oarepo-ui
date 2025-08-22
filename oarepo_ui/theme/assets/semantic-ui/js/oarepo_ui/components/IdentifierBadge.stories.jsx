import React from "react";
import { expect } from "@storybook/test";
import { IdentifierBadge, IconIdentifier } from "./IdentifierBadge";

export default {
  title: "Components/IdentifierBadge",
  component: IdentifierBadge,
  tags: ["autodocs"], // Storybook 9 autodocs
  args: {
    className: "",
  },
};

const exampleIdentifier = {
  scheme: "orcid",
  identifier: "0000-0002-1825-0097",
  url: "https://orcid.org/0000-0002-1825-0097",
};

// ---------- IdentifierBadge stories ----------

export const Default = {
  args: {
    identifier: exampleIdentifier,
    creatibutorName: "Jane Doe",
  },
  play: async ({ canvas, userEvent }) => {

    // Wait for the image to appear
    await expect(canvas.findByRole('img', { name: /ORCID/i })).toBeInTheDocument();

    // Wait for the badge text
    const badge = await canvas.findByText(/ORCID/i);
    await expect(badge).toBeVisible();

    // Try clicking the link wrapper
    const link = img.closest('a');
    await expect(link).toHaveAttribute('href', 'https://orcid.org/0000-0002-1825-0097');

    // Simulate user clicking the link
    await userEvent.click(link);
  },
};

export const WithoutLink = {
  args: {
    identifier: {
      ...exampleIdentifier,
      url: null, // no link, falls back to span + image
    },
    creatibutorName: "Jane Doe",
  },
};

export const WithDifferentScheme = {
  args: {
    identifier: {
      scheme: "ror",
      identifier: "050dkka69",
      url: "https://ror.org/050dkka69",
    },
    creatibutorName: "CESNET a.l.e.",
  },
};

export const BrokenIcon = {
  args: {
    identifier: {
      scheme: "nonexistent", // image won't exist
      identifier: "some-id",
      url: "https://example.com",
    },
    creatibutorName: "Fallback Example",
  },
};

// ---------- IconIdentifier stories (direct) ----------

export const IconOnly = {
  render: (args) => <IconIdentifier {...args} />,
  args: {
    link: "https://example.com",
    badgeTitle: "Custom Icon",
    icon: "/static/images/identifiers/orcid.svg",
    alt: "ORCID logo",
  },
};

export const IconWithoutLink = {
  render: (args) => <IconIdentifier {...args} />,
  args: {
    badgeTitle: "No Link Example",
    icon: "/static/images/identifiers/orcid.svg",
    alt: "ORCID logo",
  },
};
