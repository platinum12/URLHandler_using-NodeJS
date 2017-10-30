package client;

import java.util.ArrayList;
import java.util.List;
import java.util.Scanner;
import java.util.logging.Logger;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestTemplate;

@SpringBootApplication
public class Application {
	private static final Logger logger = Logger.getLogger(Application.class.getName());
	private static final String getAllCmd = "getAll";
	private static final String getResultsCmd = "getResults";
	private static final String getStatusCmd = "getStatus";
	private static final String testSitesCmd = "testSites";
	private static final String helpCmd = "help";

	public static void main(String args[]) {
		SpringApplication.run(Application.class);
	}

	@Bean
	public RestTemplate restTemplate(RestTemplateBuilder builder) {
		return builder.build();
	}

	@Bean
	public CommandLineRunner run(RestTemplate restTemplate) throws Exception {
		System.out.println("In Run method");
		System.out.println(">");
		Scanner input = new Scanner(System.in);
        while (input.hasNext()) {
        	processCmd(input.nextLine().trim(), restTemplate);
            System.out.println(">");
        }
        input.close();
	    return null;
	}
	
	private void processCmd(String command, RestTemplate restTemplate) {
		if (StringUtils.isEmpty(command)) {
			println("Invalid option.");
			return;
		}
		
		// getAll command
		if (getAllCmd.equalsIgnoreCase(command)){
			try {
				TestHandles testHandles = restTemplate.getForObject("http://localhost:8000/allTests",
					TestHandles.class);
				println(testHandles.toString());
			} catch (Exception ex) {
				println("ERROR: Error while fetching the test handles.");
			}
		}
		
		// getResults command
		if (command.startsWith(getResultsCmd)) {
			String[] resultsCmdArgs = command.split(" ");
			if (resultsCmdArgs == null || resultsCmdArgs.length != 2) {
				println("ERROR: Please give test handle and run command again.");
				return;
			}
			try {
				TestResult[] testResults = restTemplate.getForObject("http://localhost:8000/testResults?testHandle="+resultsCmdArgs[1],
						TestResult[].class);
				if (testResults != null) {
					for (TestResult testResult : testResults) {
						println(testResult.toString());
					}
				}
			} catch (Exception ex) {
				println("ERROR: Error while fetching the results for given test handle.");
			}
		}
		
		// getStatus command
		if (command.startsWith(getStatusCmd)) {
			String[] cmdArgs = command.split(" ");
			if (cmdArgs == null || cmdArgs.length != 2) {
				println("ERROR: Please give test handle and run command again.");
				return;
			}
			try {
				TestStatus testStatus = restTemplate.getForObject("http://localhost:8000/testStatus?testHandle="+cmdArgs[1],
						TestStatus.class);
				if (testStatus != null) {
					println(testStatus.toString());
				}
			} catch (Exception ex) {
				println("ERROR: Error while fetching the results for given test handle.");
			}
		}
		
		// startTest command
		if (command.startsWith(testSitesCmd)) {
			String[] cmdArgs = command.split(" ");
			if (cmdArgs == null || cmdArgs.length < 2) {
				println("ERROR: Please give command in format testSites <site1>,<site2> 10");
				return;
			}
			
			List<String> finalArgs = new ArrayList<>();
			try {
				for (String cmd : cmdArgs) {
					if (cmd.contains(testSitesCmd)) {
						// First argument is always the command. Start processing from next commands.
						continue;
					}
					String[] subCmds = cmd.split(",");
					for (String subCmd : subCmds) {
						// Sanitize
						subCmd = subCmd.trim();
						if (!StringUtils.isEmpty(subCmd)) {
							finalArgs.add(subCmd);
						}
					}
				}

				println(finalArgs.toString());
				boolean foundIterations = false;
				Sites sites = new Sites();
				List<String> sitesToTest = new ArrayList<>();
				for (int i=0; i<finalArgs.size(); i++) {
					String args = finalArgs.get(i);
					if (i > 0) {
						// Try and see if we have found iterations parameter.
						try {
							Long iterations = Long.parseLong(args);
							// If iterations is given before sites, its an error.
							if (sitesToTest.size() == 0) {
								println("ERROR: iterations cannot be given before a site!");
								return;
							}
							sites.setIterations(args);
							foundIterations = true;
						} catch (Exception ex) {
							//println("ERROR: Invalid iterations parameter.");
						}
					}
					if (!foundIterations) {
						sitesToTest.add(args);
					}
				}
				sites.setSitesToTest(sitesToTest.toArray(new String[sitesToTest.size()]));
				TestStatus testStatus = restTemplate.postForObject("http://localhost:8000/startTest", sites, TestStatus.class);
				println(testStatus.toString());
			} catch (Exception ex) {
				println("ERROR: Error while fetching the results for given test handle.");
			}
		}
		
	}
	
	private void println(String text) {
		System.out.println(text);
	}
}
