<style>
	th, td {
		text-align: left;
		vertical-align: top;
	}

	pre {
		tab-size: 4 !important;
	}
</style>
#	Document Pager 0.2.3

Document Pager © Mark Simon  
See also https://pager.internotes.net/

##	What does it do?

Displays and Pages a document which is sectioned using a special heading pattern.

##	Preparing the Document

Your document should include headings which are generally comments which follow a pattern.

Currently, the default pattern is:

| Document | Main Heading       | Sub Heading       |
|----------|--------------------|-------------------|
| Text     | `## Main Heading`  | `### Sub Heading` |
| Coding   | `/** Main Heading` | `/* Sub Heading`  |

Note that the `/*` style comment is a block comment. The heading will only extend to the end of the line.

##	Viewing the Document

###	Opening the Document

Naturally, you will first need to open the document. You can open a document from the local file system or from the Internet.

| Operation         | Menu       | Keyboard Shortcut |
|-------------------|------------|-------------------|
| Open a Local File | Open …     | ⌘O \| ⌃O          |
| Open a URL        | Open URL … | ⌘⇧O \| ⌃⇧O        |


###	Navigating the Document

The headings will appear on the left.

By default, the code samples are syntax-highlighted (except, of course, for Text files). If you need to copy some of the code, this will interfere with your copy.

To view the unhighlighted version, you can either:

- option/alt-click on the title
- Turn off the Highlight Syntax button
- Click on the Raw button near the content.

##	Preferences

Document Pager will create a folder in the user’s home directory called `.document-pager`. It includes:

| File--           | Usage                        |
|------------------|------------------------------|
| `languages.json` | Additional Language Settings |
| `files.json`     | A list of last open files    |

###	Additional Headings

If you want to add your own heading markers, you should add them to the `languages.json` file using the following pattern:

```js
{
	"language": {
		"extensions": ["…"],
		"breaks" { "major": ["…"], "minor": ["…"] }
	}
}
```

You can omit any of the sub sections, and you can have multiple values inside the square brackets.


Here are the default language settings:

```js
{
	"javascript": {
		"extensions": ["js","javascript"],
		"breaks": { "major": ["/**"], "minor": ["/*"]}
	},
	"php": {
		"extensions": ["php"],
		"breaks": { "major": ["/**","/*:"], "minor": ["/*"] }
	},
	"sql": {
		"extensions": ["sql"],
		"breaks": { "major": ["/**"], "minor": ["/*"] }
	},
	"css": {
		"extensions": ["css"],
		"breaks": { "major": ["/**"], "minor": ["/*"] }
	},
	"markdown": {
		"extensions": ["md","markdown","mds"],
		"breaks": { "major": ["##"]}
	},
	"text": {
		"extensions": ["txt","text","*"],
		"breaks": { "major": ["#"], "minor": ["##"] }
	}

}
```

##	MarkDown Documents

You can also page through MarkDown documents. Here the `##` heading is used for paging.

Markdown files are recognised by the following extensions: `.md`, `.markdown` and `.mds`, or others if you’re prepared to add your own language preferences.

The `.mds` extension is for a future enhancement.

If you include images, you can either use absolute references to them or you can include images relative to the document itself.

###	Special Headings

Markdown headings can take the following non-standard format:

```md
	##id.class
```

This generates HTML in the following format:

```html
	<h2 id="…" class="…"> … </h2>
```

The `id` and `class` are both optional

___Other markdown editors will not recognise this, and so it will appear as a paragraph.___

###	Custom Styles

You can add your own custom MarkDown styles in the following location:

```
filename/styles.css
```

The `filename` folder appears _without_ the markdown extension.

For example:

```
test.md
test/styles.css
```

##	Credits

Syntax Highlighting is made available through [Prism](https://prismjs.com/) by [Lea Verou](https://lea.verou.me/).

The Markdown Parser is [Marked](https://marked.js.org/).

E & OE. Share & Enjoy
