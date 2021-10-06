const fs = require('fs-extra')
const pug = require('pug')
const md = require('markdown-it')({linkify: true})

// Clean up display text for bare URLs in markdown content
const orig_normalizeLinkText = md.normalizeLinkText
md.normalizeLinkText = t => orig_normalizeLinkText(t)
	.replace(/^https?:\/\/(www\.)?/, '')
	.replace(/\/$/, '')

async function build() {
	const page_files = (await fs.readdir(`${__dirname}/pages/`))
		.filter(f => f.endsWith('.md'))
	
	for (const page_file of page_files) {
		const page = page_file.replace('.md', '')
		const content_markdown = await fs.readFile(`${__dirname}/pages/${page}.md`, 'utf-8')
		const content_html = md.render(content_markdown)
		const title = content_markdown.split('\n')[0].replace(/^#/, '').trim()
		
		const html = pug.renderFile(`${__dirname}/page.pug`, {
			title,
			content_html,
		})
		const html_file = `${__dirname}/public/${page}.html`
		await fs.ensureFile(html_file)
		await fs.writeFile(html_file, html)
	}
}

build().then(null, err => {
	console.error(err)
	process.exit(1)
})
