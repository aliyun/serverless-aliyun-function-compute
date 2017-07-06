### Develop

```
# Install serverless
# At the moment the upstream does not support aliyun as a provider
# Use our own fork instead
git clone aliyun-fc/serverless.git
cd serverless
npm install
# this links the serverless command to our fork
npm link

# link this module to global node_modules
cd serverless-aliyun-function-compute
npm install
npm link

# test the plugin in a serverless project called node-fc-hello
cd ../node-fc-hello
npm link serverless-aliyun-function-compute
serverless package
```

### Example

Example serverless.yml:

```
service: node-hello

provider:
  name: aliyun
  runtime: nodejs4.3
  project: sls-fc-test
  credentials: ~/.aliyuncli/credentials # path must be absolute

plugins:
  - serverless-aliyun-function-compute

package:
  exclude:
    - package-lock.json
    - .gitignore
    - .git/**
    - node_modules/** # exclude all node_modules....
  include:
    - node_modules/moment # except necessary ones

functions:
  currentTime:
    handler: index.ping
    events:
      - http:
          path: ping
          method: get
```

Note that `~/.aliyuncli/credentials` is where the [aliyun-cli](https://github.com/aliyun/aliyun-cli) puts the crendentials after `aliyuncli configure`. The general format would be something like:

```
[default]
aliyun_access_key_secret = xxxx
aliyun_access_key_id = yyyy
```
