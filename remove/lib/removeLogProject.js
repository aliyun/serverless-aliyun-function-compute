'use strict';

module.exports = {
    async removeLogProject(projectName, logStoreName){
        if (!this.options['remove-logstore']) {
            this.serverless.cli.log(`Skip removing log project`);
            return;
          }
        if (! await this.provider.getLogProject(projectName)){
            this.serverless.cli.log(`No log project to remove`);
            return;
        }
        if (await this.provider.getLogStore(projectName, logStoreName)){
            this.serverless.cli.log(`Removing index from log project ${projectName} log store ${logStoreName}...`);
            await this.provider.deleteLogIndex(projectName, logStoreName);
            this.serverless.cli.log(`Removed index from log project ${projectName} log store ${logStoreName}`);
            this.serverless.cli.log(`Removing log store from log project ${projectName}...`);
            await this.provider.deleteLogStore(projectName, logStoreName);
            this.serverless.cli.log(`Removed log store from log project ${projectName}`);
        }
        else {
            this.serverless.cli.log(`No log store to remove`);
        }
        this.serverless.cli.log(`Removing log project ${projectName}...`);
        await this.provider.deleteLogProject(projectName);
        this.serverless.cli.log(`Removed log project ${projectName}`);
    },
}