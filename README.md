Deployment notes

This repository can be published to GitHub Pages and served from your custom domain (prestonm.cc).

Steps to publish (GitHub Pages + Cloudflare):

1. Create a file named CNAME at the repository root containing your domain (already added: prestonm.cc).
2. In the repo Settings → Pages, set Source to the branch you want (e.g., main) and folder: / (root). Save.
3. In Cloudflare DNS:
   - Add an A record for the root (@) pointing to GitHub Pages IPs:
     185.199.108.153
     185.199.109.153
     185.199.110.153
     185.199.111.153
   - Add a CNAME record for www pointing to the GitHub Pages URL: theokgatsby.github.io (or your GitHub Pages hostname).
   - IMPORTANT: Set the Cloudflare proxy status to DNS only (grey cloud) until GitHub issues the TLS certificate. After pages show secure, you can test toggling the proxy.
4. Wait for DNS propagation and GitHub Pages to provision a certificate. Visit https://prestonm.cc

Optional: Add a favicon at /favicon.ico, compress images in /tindog/images, and add sitemap.xml and robots.txt for SEO.

If you want, I can push these changes and create a short deployment checklist or configure a redirect from the root to www. 
