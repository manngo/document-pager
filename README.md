#	Document Pager 0.1.0

Document Pager © Mark Simon
See also https://pager.internotes.net/

##	What does it do?

Displays and Pages a document which is sectioned using a special heading pattern.
Currently, the heading pattern is hard-coded to the followng:

| Document | Pattern     |
|----------|-------------|
| Text     | ## Heading  |
| Coding   | /** Heading |

By default, the code samples are syntax-highlighted (except, of course, for Text files).
If you need to copy some of the code, this will interfere with your copy.

To view the unhighlighted version, you can either:

- option/alt-click on the title
- Turn off the Highlight Syntax button
- Click on the Raw button near the content.

###	MarkDown Documents

You can also page through MarkDown documents. Here the `##` heading is used for paging.

If you include images, you can either use absolute references to them or you can include images relative to the document itself.

##	Credits

Syntax Highlighting is made available through [Prism](https://prismjs.com/) by [Lea Verou](https://lea.verou.me/).

The Markdown Parser is [Marked](https://marked.js.org/).

E & OE. Share & Enjoy
