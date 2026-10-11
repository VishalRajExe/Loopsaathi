package com.loopsaathi.config;

import com.loopsaathi.model.Partner;
import com.loopsaathi.model.Pickup;
import com.loopsaathi.model.PickupStatusLog;
import com.loopsaathi.model.Types;
import com.loopsaathi.model.WasteRule;
import com.loopsaathi.repository.PartnerRepository;
import com.loopsaathi.repository.PickupRepository;
import com.loopsaathi.repository.PickupStatusLogRepository;
import com.loopsaathi.repository.WasteRuleRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Set;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class DemoData implements CommandLineRunner {
    private final WasteRuleRepository rules;
    private final PartnerRepository partners;
    private final PickupRepository pickups;
    private final PickupStatusLogRepository logs;

    public DemoData(WasteRuleRepository rules, PartnerRepository partners,
                    PickupRepository pickups, PickupStatusLogRepository logs) {
        this.rules = rules;
        this.partners = partners;
        this.pickups = pickups;
        this.logs = logs;
    }

    @Override @Transactional
    public void run(String... args) {
        seedRules();
        seedPartners();
        seedPickups();
    }

    private void seedRules() {
        // Source: D:\Loopsathi\githubrepos\wt23-wastewise-main\WD\next-js-app\src\components\ShowResult.js
        // Source: D:\Loopsathi\githubrepos\wt23-wastewise-main\AI\classifier_tensor_flow\tensorflow_pretrained_model_20classes_v02.ipynb
        // First 20 IDs match the model class labels; other local rules cover prototype requests.
        List<WasteRule> data = List.of(
            rule("aluminum_foil", "Aluminium foil", "aluminium foil|aluminum foil|foil", Types.Stream.DRY, "Keep clean and dry for the dry-waste route.", false),
            rule("apples", "Apple leftovers", "apple|apples|apple core", Types.Stream.WET, "Add to the wet-waste collection.", false),
            rule("banana_peels", "Banana peel", "banana peel|banana peels|banana", Types.Stream.WET, "Add to the wet-waste collection.", false),
            rule("cardboard", "Cardboard", "cardboard|cardboard box", Types.Stream.DRY, "Flatten and keep dry.", false),
            rule("condoms", "Used condom", "condom|condoms", Types.Stream.SANITARY, "Wrap securely for sanitary-waste collection.", false),
            rule("diapers", "Used diaper", "diaper|diapers|nappy", Types.Stream.SANITARY, "Wrap securely for sanitary-waste collection.", false),
            rule("food_waste", "Food waste", "food waste|leftover food|food scraps", Types.Stream.WET, "Add to the wet-waste collection.", false),
            rule("glass_bottle", "Glass bottle", "glass bottle|glass jar", Types.Stream.DRY, "Empty and keep separate from other dry waste.", false),
            rule("old_books", "Old book", "old book|books|book", Types.Stream.DRY, "Keep dry; reuse or send for paper recovery.", false),
            rule("oranges", "Orange peel", "orange|oranges|orange peel", Types.Stream.WET, "Add to the wet-waste collection.", false),
            rule("pans", "Metal pan", "pan|metal pan|cooking pan", Types.Stream.DRY, "Keep separate for metal recovery.", false),
            rule("pizza_box", "Pizza box", "pizza box|pizza carton", Types.Stream.DRY, "Remove food residue and keep the clean parts dry.", false),
            rule("plastic_bags", "Plastic bag", "plastic bag|plastic bags", Types.Stream.DRY, "Keep clean and dry for the dry-waste route.", false),
            rule("plastic_packaging", "Plastic packaging", "plastic packaging|plastic wrapper|plastic wrap", Types.Stream.DRY, "Keep clean and dry for the dry-waste route.", false),
            rule("plastic_toys", "Plastic toy", "plastic toy|plastic toys", Types.Stream.DRY, "Keep separate for dry-waste collection.", false),
            rule("smartphone", "Old phone", "smartphone|phone|mobile phone|old phone", Types.Stream.E_WASTE, "Use the dedicated e-waste collection point.", true),
            rule("tampons", "Used tampon", "tampon|tampons", Types.Stream.SANITARY, "Wrap securely for sanitary-waste collection.", false),
            rule("tea_bags", "Tea bag", "tea bag|tea bags|teabag", Types.Stream.WET, "Add to the wet-waste collection.", false),
            rule("tetrapack", "Tetra pack", "tetrapack|tetra pack|drink carton", Types.Stream.DRY, "Empty and keep dry for collection.", false),
            rule("toothbrush", "Toothbrush", "toothbrush|tooth brush", Types.Stream.DRY, "Keep separate for the dry-waste route.", false),
            rule("vegetable_peels", "Vegetable peels", "vegetable peels|vegetable peel|veg peels", Types.Stream.WET, "Add to the wet-waste collection.", false),
            rule("paper", "Paper", "paper|newspaper|office paper", Types.Stream.DRY, "Keep dry for paper recovery.", false),
            rule("plastic_bottle", "Plastic bottle", "plastic bottle|pet bottle|water bottle", Types.Stream.DRY, "Empty and keep dry for recycling.", false),
            rule("tin_can", "Tin can", "tin can|metal can|tin", Types.Stream.DRY, "Empty and keep separate for metal recovery.", false),
            rule("sanitary_pad", "Used sanitary pad", "sanitary pad|pad|menstrual pad", Types.Stream.SANITARY, "Wrap securely for sanitary-waste collection.", false),
            rule("battery", "Battery", "battery|batteries|cell battery", Types.Stream.SPECIAL_CARE, "Keep intact; take to a dedicated collection point.", true),
            rule("bulb", "Light bulb", "light bulb|bulb|cfl", Types.Stream.SPECIAL_CARE, "Keep unbroken; use a special-care collection point.", true),
            rule("laptop", "Old laptop", "laptop|computer", Types.Stream.E_WASTE, "Use the dedicated e-waste collection point.", true),
            rule("charger", "Charger", "charger|charging cable|power adapter", Types.Stream.E_WASTE, "Use the dedicated e-waste collection point.", true),
            rule("earphones", "Earphones", "earphones|earbuds|headphones", Types.Stream.E_WASTE, "Use the dedicated e-waste collection point.", true),
            rule("medicine", "Expired medicine", "expired medicine|medicine|tablets", Types.Stream.SPECIAL_CARE, "Keep sealed; use a special-care collection point.", true),
            rule("coffee_grounds", "Coffee grounds", "coffee grounds|coffee waste", Types.Stream.WET, "Add to the wet-waste collection.", false)
        );
        data.stream().filter(item -> !rules.existsById(item.id)).forEach(rules::save);
    }

    private void seedPartners() {
        List<Partner> data = List.of(
            partner("PARTNER-COMPOST", "Campus Composting Unit", Types.DestinationType.COMPOSTING, Types.Stream.WET),
            partner("PARTNER-BIOGAS", "Demo Biogas Plant", Types.DestinationType.BIOGAS, Types.Stream.WET),
            partner("PARTNER-DRY", "Demo Dry Recovery Centre", Types.DestinationType.RECYCLER, Types.Stream.DRY),
            partner("PARTNER-EWASTE", "Demo E-Waste Collection Point", Types.DestinationType.E_WASTE, Types.Stream.E_WASTE)
        );
        for (Partner expected : data) {
            var existing = partners.findById(expected.id);
            if (existing.isEmpty()) {
                partners.save(expected);
            } else if (existing.get().isDemo
                    && !existing.get().acceptedStreams.equals(expected.acceptedStreams)) {
                // Reconcile only these seeded demo memberships; do not touch other partners or fields.
                existing.get().acceptedStreams.clear();
                existing.get().acceptedStreams.addAll(expected.acceptedStreams);
            }
        }
    }

    private void seedPickups() {
        demo("PICKUP-DM0001", "Banana peel", Types.Stream.WET, "1.5", null, "Hostel A", Types.Status.REQUESTED, null, 6);
        demo("PICKUP-DM0002", "Plastic bottle", Types.Stream.DRY, "2", null, "Library", Types.Status.REQUESTED, null, 5);
        demo("PICKUP-DM0003", "Old phone", Types.Stream.E_WASTE, "0.5", null, "Admin Block", Types.Status.ACCEPTED, null, 4);
        demo("PICKUP-DM0004", "Cardboard", Types.Stream.DRY, "3", "2.4", "Hostel B", Types.Status.COLLECTED, null, 3);
        demo("PICKUP-DM0005", "Food waste", Types.Stream.WET, "4", "3.6", "Canteen", Types.Status.DELIVERED, "PARTNER-COMPOST", 2);
        demo("PICKUP-DM0006", "Earphones", Types.Stream.E_WASTE, "0.8", "0.6", "Hostel C", Types.Status.DELIVERED, "PARTNER-EWASTE", 1);
    }

    private void demo(String id, String item, Types.Stream stream, String estimated, String confirmed,
                      String locality, Types.Status status, String destination, int daysAgo) {
        if (pickups.existsById(id)) return;
        Pickup pickup = new Pickup();
        pickup.id = id;
        pickup.wasteType = item;
        pickup.stream = stream;
        pickup.estimatedWeightKg = new BigDecimal(estimated);
        pickup.confirmedWeightKg = confirmed == null ? null : new BigDecimal(confirmed);
        pickup.locality = locality;
        pickup.preferredSlot = Types.Slot.MORNING;
        pickup.status = status;
        pickup.collectorId = status == Types.Status.REQUESTED ? null : "DEMO-COLLECTOR";
        pickup.destinationId = destination;
        pickup.isDemo = true;
        pickup.createdAt = Instant.now().minus(daysAgo, ChronoUnit.DAYS);
        pickup.updatedAt = pickup.createdAt.plus(status.ordinal(), ChronoUnit.HOURS);
        pickups.save(pickup);
        for (int i = 0; i <= status.ordinal(); i++) {
            logs.save(new PickupStatusLog(id, Types.Status.values()[i], pickup.createdAt.plus(i, ChronoUnit.HOURS)));
        }
    }

    private static WasteRule rule(String id, String name, String keywords, Types.Stream stream,
                                  String instruction, boolean special) {
        WasteRule rule = new WasteRule();
        rule.id = id;
        rule.itemName = name;
        rule.keywords = keywords;
        rule.stream = stream;
        rule.instruction = instruction;
        rule.specialRoute = special;
        return rule;
    }

    private static Partner partner(String id, String name, Types.DestinationType type, Types.Stream... accepted) {
        Partner partner = new Partner();
        partner.id = id;
        partner.name = name;
        partner.destinationType = type;
        partner.acceptedStreams = Set.of(accepted);
        partner.isDemo = true;
        return partner;
    }
}
