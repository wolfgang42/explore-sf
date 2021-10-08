const fs = require('fs-extra')
const pug = require('pug')
const child_process = require('child_process')
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
		const md_file = `${__dirname}/pages/${page}.md`
		const content_markdown = await fs.readFile(md_file, 'utf-8')
		const content_html = md.render(content_markdown)
		const title = content_markdown.split('\n')[0].replace(/^#/, '').trim()
		
		const {stdout: lastmod_str} = child_process.spawnSync('git', ['log', '-1', '--format=%aI', '--', md_file], {encoding: 'utf-8'})
		const [lastmod_date] = lastmod_str.split('T')
		const [lastmod_year] = lastmod_date.split('-')
		
		const html = pug.renderFile(`${__dirname}/page.pug`, {
			page_name: page === 'index' ? '' : page,
			page_id: page,
			title,
			content_html,
			lastmod_year,
			lastmod_date,
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
