// 日志配置文件
import path from "path";
import log4js from "log4js";

// log4js默认的日志级别如下：ALL < TRACE < DEBUG < INFO < WARN < ERROR < FATAL < MARK < OFF
const __dirname = path.resolve("./");
log4js.configure({
  appenders: {
    // 配置打印输出源
    trace: {
      type: "console", // 控制台打印日志
      filename: path.join(__dirname, "/logs", "trace", "trace"), // 写入日志文件的路径
      pattern: "yyyy-MM-dd.log", //确定何时滚动日志的模式,只在type: dateFile模式有效,(默认为.yyyy-MM-dd0),表示一个文件的时间命名模式,格式:.yyyy-MM-dd-hh:mm:ss.log,在生成文件中会依照pattern配置来在filename的文件结尾追加一个时间串来命名文件。
      encoding: "utf-8", // default "utf-8"，文件的编码
      alwaysIncludePattern: true, //将模式包含在当前日志文件的名称以及备份中,只在type: dateFile模式有效,(默认为false),配置为ture即最终的日志路径文件名为filename + pattern
    },
    file: {
      type: "file",
      filename: path.join(__dirname, "/logs", 'log'),
      pattern: "yyyy-MM-dd.log",
      encoding: "utf-8",
      alwaysIncludePattern: true,
    },
    console: {
      type: "console",
    }
  },
  categories: {
    default: { appenders: ["console", "file"], level: "DEBUG" }
  }
});

export const logger = log4js.getLogger();
console.log = logger.info.bind(logger);
console.error = logger.error.bind(logger);
