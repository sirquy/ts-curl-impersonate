import * as proc from "child_process";
import * as path from 'path';
export class CurlImpersonate {
    constructor(url, options) {
        this.url = url;
        this.options = options;
        this.validMethods = ["GET", "POST"];
        this.binary = "";
    }
    makeRequest() {
        if (this.validateOptions(this.options)) {
            this.setProperBinary();
            let headers = this.convertHeaderObjectToCURL();
            let flags = this.options.flags || [];
            switch (this.options.method.toUpperCase()) {
                case "GET":
                    this.getRequest(flags, headers);
                    break;
                case "POST":
                    this.postRequest(flags, headers);
            }
        }
    }
    validateOptions(options) {
        if (this.validMethods.includes(options.method.toUpperCase())) {
            if (options.body !== undefined && options.method == "GET") {
                throw new Error("Method is GET with an HTTP payload!");
            }
            else {
                try {
                    new URL(this.url);
                    return true;
                }
                catch {
                    throw new Error("URL is invalid! Must have http:// or https:// !");
                }
            }
        }
        else {
            throw new Error("Invalid Method! Valid HTTP methods are " + this.validMethods);
        }
    }
    setProperBinary() {
        switch (process.platform) {
            case "linux":
                if (process.arch == "x64") {
                    this.binary = "curl-impersonate-chrome-linux-x86";
                    break;
                }
                else if (process.arch == "arm") {
                    this.binary = "curl-impersonate-chrome-linux-aarch64";
                    break;
                }
                else {
                    throw new Error(`Unsupported architecture: ${process.arch}`);
                }
            case "darwin":
                this.binary = "curl-impersonate-chrome-darwin-x86";
                break;
            default:
                throw new Error(`Unsupported Platform! ${process.platform}`);
        }
    }
    getRequest(flags, headers) {
        if (this.options.followRedirects) {
            flags.push("-L");
        }
        if (this.options.timeout) {
            flags.push(`--connect-timeout ${this.options.timeout / 1000}`);
        }
        let binpath = path.join(__dirname, "..", "bin", this.binary);
        let args = `${flags.join(" ")} ${headers} ${this.url}`;
        proc.spawn(`${binpath} ${args}`, { shell: true, stdio: "inherit" });
    }
    postRequest(flags, headers) {
        if (this.options.followRedirects) {
            flags.push("-L");
        }
        if (this.options.timeout) {
            flags.push(`--connect-timeout ${this.options.timeout / 1000}`);
        }
        let binpath = path.join(__dirname, "..", "bin", this.binary);
        let args = `${flags.join(" ")} ${headers} -d '${JSON.stringify(this.options.body)}' ${this.url}`;
        proc.spawn(`${binpath} ${args}`, { shell: true, stdio: "inherit" });
    }
    convertHeaderObjectToCURL() {
        return Object.entries(this.options.headers).map(([key, value]) => `-H '${key}: ${value}'`).join(' ');
    }
}
export default CurlImpersonate;