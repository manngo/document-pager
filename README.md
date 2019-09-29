<style>
	th, td {
		text-align: left;
		vertical-align: top;
	}

	pre {
		tab-size: 4 !important;
	}
</style>

#	Document Pager 0.2.0

Document Pager © Mark Simon
See also https://pager.internotes.net/

##	What does it do?

Displays and Pages a document which is sectioned using a special heading pattern.

##	Preparing the Document

Your document should include headings which are generally comments which follow a pattern.

Currently, the default pattern is:

| Document | Main Heading     | Sub Heading     |
|----------|------------------|-----------------|
| Text     | ## Main Heading  | ### Sub Heading |
| Coding   | /** Main Heading | /* Sub Heading  |

Note that the `/*` style comment is a block comment. The heading will only extend to the end of the line.

##	Viewing the Document

The headings will appear on the left.

By default, the code samples are syntax-highlighted (except, of course, for Text files). If you need to copy some of the code, this will interfere with your copy.

To view the unhighlighted version, you can either:

- option/alt-click on the title
- Turn off the Highlight Syntax button
- Click on the Raw button near the content.

##	Preferences

Document Pager will create a folder in the user’s home directory called `.document-pager`. It includes:

| File        | Usage                                                                 |
|-------------|-----------------------------------------------------------------------|
| breaks.json | Additional Heading Patterns<br>They can override the default patterns |
| files.json  | A list of last open files                                             |

###	Additional Headings

If you want to add your own heading markers, you should add them to the `breaks.json` file using the following pattern:

```js
{
	"language": { "major": "…", "minor": "…" }
}
```

Here are the default breaks:

```js
{
	"php": { "major": ["/**","/*:"], "minor": "/*" },
	"javascript": { "major": "/**", "minor": "/*" },
	"sql": { "major": "/**", "minor": "/*" },
	"css": { "major": "/**", "minor": "/*" },
	"md": { "major": "##", "minor": "###" },
	"markdown": { "major": "##", "minor": "###" },
	"*": { "major": "##", "minor": "###" }
}
```

##	MarkDown Documents

You can also page through MarkDown documents. Here the `##` heading is used for paging.

If you include images, you can either use absolute references to them or you can include images relative to the document itself.

##	Credits

Syntax Highlighting is made available through [Prism](https://prismjs.com/) by [Lea Verou](https://lea.verou.me/).

The Markdown Parser is [Marked](https://marked.js.org/).

E & OE. Share & Enjoy
