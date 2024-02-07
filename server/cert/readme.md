## What is the purpose of this dir?

To store the cert and its associated key for use by the server.
These two files should NEVER be commited to VCS.

## How do i get these files?

You can generate them using for example the certbot:
```
certbot -d your.domain.xyz --manual --preferred-challenges dns certonly
```
